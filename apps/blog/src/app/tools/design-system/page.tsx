import { SimpleLayout } from "@/components/template/SimpleLayout"

import ColorTable from "./ColorTable"
import ThemePreview from "./ThemePreview"

export default function ComponentPreview() {
  return (
    <SimpleLayout
      title="Design System"
      intro="Built-in daisyUI components following current color theme"
    >
      <ColorTable />
      <ThemePreview />
    </SimpleLayout>
  )
}
