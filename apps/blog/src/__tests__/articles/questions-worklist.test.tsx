import { afterEach, describe, expect, it } from "bun:test";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { OpenQuestionConcept } from "@/app/(blog)/articles/service";
import { QuestionsWorklist } from "@/app/(blog)/questions/questions-worklist";

const concepts: OpenQuestionConcept[] = [
  {
    domain: "agent-systems",
    slug: "agent-loop-pattern",
    title: "Agent Loop Pattern",
    questions: [
      {
        kind: "now",
        text: "Does the loop terminate on a partial tool result?",
      },
      { kind: "source", text: "Who first published the harness benchmark?" },
    ],
    resolved: ["Retries are capped at three."],
  },
  {
    domain: "evals-and-benchmarks",
    slug: "eval-drift",
    title: "Eval Drift",
    questions: [{ kind: "wait", text: "Will the benchmark be rerun in 2027?" }],
    resolved: [],
  },
];

const FOUR_LINES = /4 lines/;
const TWO_OF_FOUR = /2 of 4/;
const NO_MATCH = /Nothing in the backlog matches/;
const CLEAR = /Clear filters/;

const searchBox = () => screen.getByLabelText("Search open questions");

/**
 * Line text, read off the rendered rows. Search wraps every match in a `mark`,
 * so a question's text is split across elements and only reads back whole here.
 */
const lines = (): string =>
  [...document.querySelectorAll("li li")]
    .map((node) => node.textContent ?? "")
    .join("\n");

afterEach(cleanup);

describe("QuestionsWorklist", () => {
  it("renders every line and tallies each triage bucket", () => {
    render(<QuestionsWorklist concepts={concepts} />);
    expect(lines()).toContain("Does the loop terminate");
    expect(lines()).toContain("Will the benchmark be rerun");
    expect(lines()).toContain("Retries are capped at three.");
    // Four lines across two concepts.
    expect(screen.getByText(FOUR_LINES)).toBeDefined();
    expect(screen.getByText("Answerable now")).toBeDefined();
    expect(screen.getByLabelText("Filter by triage")).toBeDefined();
  });

  it("narrows to the lines matching every search token", () => {
    render(<QuestionsWorklist concepts={concepts} />);
    fireEvent.change(searchBox(), { target: { value: "benchmark" } });
    expect(lines()).toContain("Who first published");
    expect(lines()).toContain("Will the benchmark be rerun");
    expect(lines()).not.toContain("Does the loop terminate");
    expect(screen.getByText(TWO_OF_FOUR)).toBeDefined();
    expect(document.querySelectorAll("mark").length).toBe(2);
  });

  it("matches a line through its concept title", () => {
    render(<QuestionsWorklist concepts={concepts} />);
    fireEvent.change(searchBox(), { target: { value: "eval drift" } });
    expect(lines()).toContain("Will the benchmark be rerun");
    expect(lines()).not.toContain("Who first published");
  });

  it("filters to one triage bucket and back", () => {
    render(<QuestionsWorklist concepts={concepts} />);
    const now = screen.getByText("Answerable now");
    fireEvent.click(now);
    expect(lines()).toContain("Does the loop terminate");
    expect(lines()).not.toContain("Who first published");
    expect(lines()).not.toContain("Retries are capped at three.");
    fireEvent.click(now);
    expect(lines()).toContain("Who first published");
  });

  it("filters by domain and offers a way out of an empty result", () => {
    render(<QuestionsWorklist concepts={concepts} />);
    fireEvent.click(screen.getByText("Evals & Benchmarks"));
    expect(lines()).not.toContain("Does the loop terminate");
    fireEvent.change(searchBox(), { target: { value: "zzzz" } });
    expect(screen.getByText(NO_MATCH)).toBeDefined();
    fireEvent.click(screen.getByText(CLEAR));
    expect(lines()).toContain("Does the loop terminate");
  });

  it("renders the vault's inline markup as elements, not as characters", () => {
    const marked: OpenQuestionConcept[] = [
      {
        domain: "agent-systems",
        slug: "agent-loop-pattern",
        title: "Agent Loop Pattern",
        questions: [
          {
            kind: null,
            text: "Do gains hold when **normalized for size**, or is `churn` the *real* signal? See [the paper](/articles/eval-drift).",
          },
        ],
        resolved: [],
      },
    ];
    render(<QuestionsWorklist concepts={marked} />);

    expect(document.querySelector("li li strong")?.textContent).toBe(
      "normalized for size"
    );
    expect(document.querySelector("li li em")?.textContent).toBe("real");
    expect(document.querySelector("li li code")?.textContent).toBe("churn");
    const link = document.querySelector<HTMLAnchorElement>(
      'li li a[href="/articles/eval-drift"]'
    );
    expect(link?.textContent).toBe("the paper");
    // The markers themselves must not survive into the rendered prose.
    expect(lines()).not.toContain("**");
    expect(lines()).not.toContain("`");
  });

  it("searches the prose, not the markup around it", () => {
    const marked: OpenQuestionConcept[] = [
      {
        domain: "agent-systems",
        slug: "agent-loop-pattern",
        title: "Agent Loop Pattern",
        questions: [{ kind: null, text: "Does **normalization** hold?" }],
        resolved: [],
      },
    ];
    render(<QuestionsWorklist concepts={marked} />);
    fireEvent.change(searchBox(), { target: { value: "normalization" } });
    expect(lines()).toContain("Does normalization hold?");
    expect(document.querySelector("strong mark")?.textContent).toBe(
      "normalization"
    );
  });

  it("keeps working when the manifest carries no triage tags", () => {
    const untagged: OpenQuestionConcept[] = [
      {
        domain: "agent-systems",
        slug: "agent-loop-pattern",
        title: "Agent Loop Pattern",
        questions: [{ kind: null, text: "An untagged bullet." }],
        resolved: [],
      },
    ];
    render(<QuestionsWorklist concepts={untagged} />);
    expect(screen.getByText("An untagged bullet.")).toBeDefined();
    // A single bucket carries no distribution, so the tally band stays hidden.
    expect(screen.queryByLabelText("Filter by triage")).toBeNull();
  });
});
