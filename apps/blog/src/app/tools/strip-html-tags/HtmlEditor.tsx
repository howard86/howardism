"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { DiffEditor, DiffEditorProps, DiffOnMount, MonacoDiffEditor } from "@monaco-editor/react"
import copy from "copy-to-clipboard"
import { useRef, useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"

import FormInput from "@/app/profile/resume/FormInput"

interface HtmlEditorProps {
  html: string
}

const EDITOR_OPTIONS = {
  autoIndent: "full",
  contextmenu: true,
  fontFamily: "monospace",
  fontSize: 13,
  lineHeight: 24,
  hideCursorInOverviewRuler: true,
  matchBrackets: "always",
  minimap: {
    enabled: true,
  },
  scrollbar: {
    horizontalSliderSize: 4,
    verticalSliderSize: 18,
  },
  selectOnLineNumbers: true,
  roundedSelection: false,
  readOnly: false,
  cursorStyle: "line",
  automaticLayout: true,
  formatOnPaste: true,
  formatOnType: true,
} satisfies DiffEditorProps["options"]

type HtmlState = {
  html?: string
  map: Record<string, number>
  keys: string[]
}

const editorSchema = z.object({
  remoteUrl: z.string().url().optional(),
})

export default function HtmlEditor({ html }: HtmlEditorProps) {
  const { register, setError, formState, handleSubmit } = useForm<z.infer<typeof editorSchema>>({
    resolver: zodResolver(editorSchema),
  })
  const [nodeState, setNodeState] = useState<HtmlState>({ html, map: {}, keys: [] })

  const htmlHistoryRef = useRef<string[]>([html])

  const editorRef = useRef<MonacoDiffEditor | null>(null)

  const handleOnMount: DiffOnMount = (editor) => {
    editorRef.current = editor
  }

  const handleSave = () => {
    if (!editorRef.current) return

    const newHtml = editorRef.current.getModifiedEditor().getValue()

    htmlHistoryRef.current.push(newHtml)

    editorRef.current.getOriginalEditor().setValue(newHtml)
  }

  const handleFormat = () => {
    if (!editorRef.current) return

    editorRef.current.getModifiedEditor().getAction("editor.action.formatDocument")?.run()
  }

  const handleCalculate = () => {
    if (!editorRef.current) return

    const newHtml = editorRef.current.getModifiedEditor().getValue()

    const parser = new DOMParser()
    const doc = parser.parseFromString(newHtml, "text/html")

    const result: Record<string, number> = {}

    doc.querySelectorAll("*").forEach((node) => {
      const tag = node.tagName.toLowerCase()

      result[tag] = result[tag] ? result[tag] + 1 : 1
    })

    setNodeState((state) => ({ ...state, keys: Object.keys(result).sort(), map: result }))
  }

  const handleReplaceImg = () => {
    if (!editorRef.current) return

    const newHtml = editorRef.current.getModifiedEditor().getValue()

    const parser = new DOMParser()
    const doc = parser.parseFromString(newHtml, "text/html")

    doc.querySelectorAll("img").forEach((node) => {
      const img = document.createElement("img")

      img.src = "https://via.placeholder.com/30"
      img.alt = node.alt || "placeholder"

      node.replaceWith(img)
    })

    doc.querySelectorAll("svg").forEach((node) => {
      const svg = document.createElement("svg")

      svg.ariaLabel = "placeholder"

      node.replaceWith(svg)
    })

    editorRef.current.getModifiedEditor().setValue(doc.documentElement.outerHTML)

    handleFormat()
  }

  const handleStripClass = () => {
    if (!editorRef.current) return

    const newHtml = editorRef.current.getModifiedEditor().getValue()

    const parser = new DOMParser()
    const doc = parser.parseFromString(newHtml, "text/html")

    doc.querySelectorAll("*").forEach((node) => {
      node.removeAttribute("class")
      node.removeAttribute("style")
    })

    editorRef.current.getModifiedEditor().setValue(doc.documentElement.outerHTML)
    handleFormat()
  }

  const handleStripElement = () => {
    if (!editorRef.current) return

    const newHtml = editorRef.current.getModifiedEditor().getValue()

    const parser = new DOMParser()
    const doc = parser.parseFromString(newHtml, "text/html")

    const node = doc.getElementById("__NEXT_DATA__")

    if (node) {
      node.remove()
    }

    editorRef.current.getModifiedEditor().setValue(doc.documentElement.outerHTML)
    handleFormat()
  }

  const handleCopy = () => {
    if (!editorRef.current) return

    const newHtml = editorRef.current
      .getModifiedEditor()
      .getValue({
        preserveBOM: false,
        lineEnding: "",
      })
      .replaceAll(/(&nbsp;|\n)/g, "")
      .replaceAll(/>\s+</g, "><")

    copy(newHtml)
  }

  return (
    <div className="space-y-4 text-slate-500">
      <form
        className="flex flex-col items-center justify-center gap-4"
        onSubmit={handleSubmit(async (values) => {
          if (!values.remoteUrl) return

          const response = await fetch(`/api/proxy?url=${values.remoteUrl}`)

          if (!response.ok && response.status >= 500) {
            console.error(response)
            setError("remoteUrl", {
              type: "value",
              message: "Something went wrong",
            })
            return
          }

          const { data, message } = await response.json()

          if (!response.ok) {
            setError("remoteUrl", {
              type: "value",
              message,
            })

            return
          }

          setNodeState((state) => ({ ...state, html: data }))
        })}
      >
        <FormInput
          className="w-full"
          type="url"
          register={register}
          name="remoteUrl"
          label="Remote URL"
          errors={formState.errors}
        />
        <button className="button" type="submit" disabled={formState.isSubmitting}>
          Fetch URL
        </button>
      </form>
      <div className="flex">
        <button type="button" className="button" onClick={handleFormat}>
          Format
        </button>
        <button type="button" className="button" onClick={handleSave}>
          Save
        </button>
        <button type="button" className="button" onClick={handleCalculate}>
          Calculate
        </button>
        <button type="button" className="button" onClick={handleReplaceImg}>
          Replace img
        </button>
        <button type="button" className="button" onClick={handleStripClass}>
          Strip class
        </button>
        <button type="button" className="button" onClick={handleStripElement}>
          Strip element
        </button>
        <button type="button" className="button" onClick={handleCopy}>
          Copy
        </button>
      </div>
      <div>
        {nodeState.keys.map((key) => (
          <div key={key}>
            {key} : {nodeState.map[key]}
          </div>
        ))}
      </div>
      <DiffEditor
        language="html"
        theme="vs-dark"
        original={nodeState.html}
        modified={nodeState.html}
        height={800}
        onMount={handleOnMount}
        options={EDITOR_OPTIONS}
      />
    </div>
  )
}
