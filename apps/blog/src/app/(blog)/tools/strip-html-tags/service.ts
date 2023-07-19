import type { editor } from "monaco-editor"

export const updateEditorValue = (
  editor: editor.IStandaloneCodeEditor | undefined | null,
  value: string,
) => {
  if (!editor) return

  const model = editor.getModel()

  if (!model) return

  editor.executeEdits(null, [
    {
      range: model.getFullModelRange(),
      text: value,
    },
  ])
}

export const formatEditorValue = (editor: editor.IStandaloneCodeEditor | undefined | null) => {
  const action = editor?.getAction("editor.action.formatDocument")

  if (!action) return

  action.run()
}

export const loopThroughHtmlNodes = (html: string, func: (node: Element) => void): Document => {
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, "text/html")

  doc.querySelectorAll("*").forEach(func)

  return doc
}
