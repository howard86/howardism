import { SimpleLayout } from "@/app/(common)/SimpleLayout";

import ThemePreview from "./ThemePreview";

export default function ComponentPreview() {
  return (
    <SimpleLayout
      intro="Built-in daisyUI components following current color theme"
      title="Design System"
    >
      <ThemePreview />
    </SimpleLayout>
  );
}
