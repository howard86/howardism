import { describe, expect, it } from "bun:test";

import { parseOpenQuestions } from "@howardism/article-contract/manifests/open-questions";

import { buildOpenQuestions } from "../import-wiki/pages/open-questions.ts";
import type { ParsedWikiFile } from "../import-wiki/parse.ts";

function file(slug: string, body: string): ParsedWikiFile {
  return {
    body,
    frontmatter: {},
    mtime: new Date(0),
    source: {
      absolutePath: `/vault/${slug}.md`,
      relativePath: `${slug}.md`,
      slug,
    },
  } as unknown as ParsedWikiFile;
}

const BACKLOG = `# Open Questions Backlog

## Actionable by domain

### agent-systems (2 open)

#### [[alpha]]

- Can this be answered from the wiki? #oq/now
- Needs a paper that does not exist. #oq/source

#### [[beta]]

- A prediction about the next model. #oq/wait

## Predictions — \`#oq/wait\` (1)

- [[gamma]]: A flat bullet that belongs to no concept.
`;

const build = (parsed: ParsedWikiFile[]) =>
  buildOpenQuestions({
    generatedOn: "2026-01-01",
    membership: new Map(),
    parsed,
    slugTitleMap: new Map([["alpha", "Alpha"]]),
  });

describe("buildOpenQuestions", () => {
  it("carries the #oq triage tag through and strips it from the text", () => {
    const manifest = build([file("open-questions", BACKLOG)]);
    const alpha = manifest.byConcept.find((c) => c.slug === "alpha");

    expect(alpha?.questions).toEqual([
      { kind: "now", text: "Can this be answered from the wiki?" },
      { kind: "source", text: "Needs a paper that does not exist." },
    ]);
    expect(alpha?.title).toBe("Alpha");
  });

  it("does not attribute the trailing flat sections to the last concept", () => {
    const manifest = build([file("open-questions", BACKLOG)]);

    expect(manifest.byConcept.map((c) => c.slug).sort()).toEqual([
      "alpha",
      "beta",
    ]);
    expect(
      manifest.byConcept.find((c) => c.slug === "beta")?.questions
    ).toEqual([{ kind: "wait", text: "A prediction about the next model." }]);
  });

  it("reads a tag written mid-bullet, ahead of a trailing parenthetical", () => {
    const manifest = build([
      file(
        "open-questions",
        "#### [[alpha]]\n\n- Does it cause or correlate? #oq/source (Not addressed by the paper.)\n"
      ),
    ]);

    expect(manifest.byConcept[0].questions).toEqual([
      {
        kind: "source",
        text: "Does it cause or correlate? (Not addressed by the paper.)",
      },
    ]);
  });

  it("harvests Resolved Questions from concept pages", () => {
    const manifest = build([
      file("open-questions", BACKLOG),
      file(
        "alpha",
        "## Open Questions\n\n- still open #oq/now\n\n## Resolved Questions\n\n- Settled by a source. **Answered:** yes\n\n## Sources\n\n- not a question\n"
      ),
    ]);

    expect(
      manifest.byConcept.find((c) => c.slug === "alpha")?.resolved
    ).toEqual(["Settled by a source. **Answered:** yes"]);
  });

  it("keeps a concept whose questions are all resolved", () => {
    const manifest = build([
      file("open-questions", BACKLOG),
      file("delta", "## Resolved Questions\n\n- All done.\n"),
    ]);

    const delta = manifest.byConcept.find((c) => c.slug === "delta");
    expect(delta?.questions).toEqual([]);
    expect(delta?.resolved).toEqual(["All done."]);
  });

  it("reads the pre-triage manifest shape as untagged", () => {
    const legacy = parseOpenQuestions({
      byConcept: [
        {
          domain: "agent-systems",
          questions: ["a bare string from an older import"],
          slug: "alpha",
          title: "Alpha",
        },
      ],
      generatedOn: "2026-01-01",
    });

    expect(legacy.byConcept[0].questions).toEqual([
      { kind: null, text: "a bare string from an older import" },
    ]);
    expect(legacy.byConcept[0].resolved).toEqual([]);
  });
});
