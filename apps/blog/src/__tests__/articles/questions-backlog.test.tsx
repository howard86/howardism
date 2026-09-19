import { afterEach, describe, expect, it } from "bun:test";
import { cleanup, render, screen } from "@testing-library/react";
import { QuestionsBacklog } from "@/app/(blog)/questions/questions-backlog";

afterEach(cleanup);

describe("QuestionsBacklog", () => {
  it("shows a loading note, then the worklist over the fetched backlog", async () => {
    render(<QuestionsBacklog />);
    expect(screen.getByRole("status").textContent).toBe(
      "Loading the worklist…"
    );

    // The manifest arrives as its own chunk, so the worklist only mounts once
    // the dynamic import resolves.
    expect(await screen.findByLabelText("Search open questions")).toBeDefined();
    expect(screen.queryByRole("status")).toBeNull();
    expect(document.querySelectorAll("li li").length).toBeGreaterThan(0);
  });
});
