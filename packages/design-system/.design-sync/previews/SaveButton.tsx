import { SaveButton } from "@howardism/design-system";

export const Unsaved = () => (
  <SaveButton initialSaved={false} showLabel slug="agent-context-files" />
);

export const Saved = () => (
  <SaveButton initialSaved showLabel slug="benchmark-contamination" />
);

export const IconOnly = () => (
  <div className="flex gap-4">
    <SaveButton initialSaved={false} slug="asynchronous-rl-for-llms" />
    <SaveButton initialSaved slug="agent-context-files" />
  </div>
);
