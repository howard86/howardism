import type { DocumentNode } from "graphql";
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

/** Minimal structural type for nodes that may carry a selection set. */
interface SelectableNode {
  selectionSet?: { selections: SelectableNode[] };
}

/** Walks the AST and returns the maximum field nesting depth. */
function maxDepth(doc: DocumentNode): number {
  let max = 0;

  const visit = (node: SelectableNode, depth: number): void => {
    if (depth > max) {
      max = depth;
    }
    if (node.selectionSet) {
      for (const sel of node.selectionSet.selections) {
        visit(sel, depth + 1);
      }
    }
  };

  for (const def of doc.definitions) {
    if (def.kind === "OperationDefinition") {
      visit(def as unknown as SelectableNode, 0);
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

  if (maxDepth(document) > MAX_QUERY_DEPTH) {
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
