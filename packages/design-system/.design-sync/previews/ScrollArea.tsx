import { ScrollArea } from "@howardism/design-system";

const notes = [
  "Agent Context Files",
  "Benchmark Contamination Checks",
  "Harness Swap vs. Rerun Noise",
  "Tool Call Budgets",
  "Long-Horizon Task Decay",
  "Eval Harness Drift",
  "Memory Compaction Strategies",
  "Sandboxing Code Agents",
  "Reward Hacking in Coding Evals",
  "Prompt Caching Economics",
  "Subagent Delegation Patterns",
  "Retrieval vs. Long Context",
];

export const NoteList = () => (
  <ScrollArea className="h-64 w-72 rounded-lg border">
    <div className="p-4">
      <h4 className="mb-3 font-medium text-sm">Recent notes</h4>
      {notes.map((n) => (
        <div className="border-b py-2 text-sm last:border-b-0" key={n}>
          {n}
        </div>
      ))}
    </div>
  </ScrollArea>
);

export const ShortList = () => (
  <ScrollArea className="h-32 w-72 rounded-lg border">
    <ul className="p-4 text-sm">
      {notes.slice(0, 8).map((n) => (
        <li className="py-1" key={n}>
          {n}
        </li>
      ))}
    </ul>
  </ScrollArea>
);
