import type {
  DocumentNode,
  FragmentDefinitionNode,
  SelectionNode,
} from "graphql";
import { parse } from "graphql";
import type { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";

import { GITHUB_ENDPOINT } from "@/constants/github";

// Keep in sync with src/gql/*.graphql (non-fragment operations only)
const ALLOWED_OPERATIONS = new Set(["getUser", "searchUsers"]);

const MAX_QUERY_DEPTH = 8;

const bodySchema = z.object({
  query: z.string(),
  operationName: z.string(),
  variables: z.record(z.string(), z.unknown()).optional(),
});

/**
 * Walks the document's selection sets — resolving fragment spreads into their
 * definitions — and returns the maximum field nesting depth.
 *
 * Throws on unknown fragment names or cyclic fragment references so the
 * caller can return 400 without forwarding to upstream.
 */
function maxDepth(doc: DocumentNode): number {
  // Index all fragment definitions for O(1) spread resolution
  const fragments = new Map<string, FragmentDefinitionNode>();
  for (const def of doc.definitions) {
    if (def.kind === "FragmentDefinition") {
      fragments.set(def.name.value, def);
    }
  }

  let max = 0;

  // Resolve a fragment spread — validates against cycles and unknown names,
  // then recurses into the fragment's selections at the same depth level.
  function resolveSpread(
    name: string,
    depth: number,
    visited: Set<string>
  ): void {
    if (visited.has(name)) {
      throw new Error(`Cyclic fragment reference: ${name}`);
    }
    const frag = fragments.get(name);
    if (!frag) {
      throw new Error(`Unknown fragment: ${name}`);
    }
    const nextVisited = new Set(visited);
    nextVisited.add(name);
    // Spread itself adds no depth — recurse at current depth
    visitSelections(frag.selectionSet.selections, depth, nextVisited);
  }

  // Walk a selection list, updating `max` and recursing into sub-selections.
  function visitSelections(
    selections: readonly SelectionNode[],
    depth: number,
    visited: Set<string>
  ): void {
    for (const sel of selections) {
      if (sel.kind === "FragmentSpread") {
        resolveSpread(sel.name.value, depth, visited);
      } else {
        // Field or InlineFragment — each adds one nesting level
        const nextDepth = depth + 1;
        if (nextDepth > max) {
          max = nextDepth;
        }
        if (sel.selectionSet) {
          visitSelections(sel.selectionSet.selections, nextDepth, visited);
        }
      }
    }
  }

  for (const def of doc.definitions) {
    if (def.kind === "OperationDefinition") {
      visitSelections(def.selectionSet.selections, 0, new Set());
    }
  }

  return max;
}

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const token = process.env.GITHUB_ACCESS_TOKEN;
  if (!token) {
    return res.status(500).json({ message: "GitHub token not configured" });
  }

  const parsed = bodySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid request body" });
  }

  const { query, operationName, variables } = parsed.data;

  if (!ALLOWED_OPERATIONS.has(operationName)) {
    return res.status(400).json({ message: "Operation not allowed" });
  }

  let document: DocumentNode;
  try {
    document = parse(query);
  } catch {
    return res.status(400).json({ message: "Invalid GraphQL query" });
  }

  // Reject mutations and subscriptions — only read-only queries are forwarded
  for (const def of document.definitions) {
    if (def.kind === "OperationDefinition" && def.operation !== "query") {
      return res
        .status(400)
        .json({ message: "Only query operations are allowed" });
    }
  }

  let depth: number;
  try {
    depth = maxDepth(document);
  } catch (err) {
    return res.status(400).json({
      message: err instanceof Error ? err.message : "Invalid query structure",
    });
  }

  if (depth > MAX_QUERY_DEPTH) {
    return res.status(400).json({ message: "Query depth limit exceeded" });
  }

  const response = await fetch(GITHUB_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ query, operationName, variables }),
  });

  const data = await response.json();
  return res.status(response.status).json(data);
};

export default handler;
