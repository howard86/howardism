"use client"

/* eslint-disable jsx-a11y/label-has-associated-control */

import { zodResolver } from "@hookform/resolvers/zod"
import { DiffEditor, DiffEditorProps, DiffOnMount, MonacoDiffEditor } from "@monaco-editor/react"
import * as Popover from "@radix-ui/react-popover"
import copy from "copy-to-clipboard"
import { useRef } from "react"
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

const editorSchema = z.object({
  html: z.string().optional(),
  remoteUrl: z.string().url().optional(),
  selectedKeys: z.array(z.string()),
  selectedKeyMap: z.record(z.string(), z.boolean().optional()),
  attributeKeys: z.array(z.string()),
  attributeMap: z.record(z.string(), z.number().optional()),
})

export default function HtmlEditor({ html }: HtmlEditorProps) {
  const { register, setError, getValues, setValue, formState, handleSubmit, watch } = useForm<
    z.infer<typeof editorSchema>
  >({
    resolver: zodResolver(editorSchema),
    defaultValues: {
      html,
      remoteUrl: "",
      selectedKeys: [],
      selectedKeyMap: {},
      attributeKeys: [],
      attributeMap: {},
    },
  })
  const controlledHtml = watch("html")

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

    const keys = Object.keys(result).sort()

    const selectedKeys = getValues("selectedKeys")
    const selectedKeyMap = getValues("selectedKeyMap")

    setValue(
      "selectedKeys",
      selectedKeys.length > 0 ? selectedKeys.filter((key) => result[key]) : keys
    )

    setValue(
      "selectedKeyMap",
      Object.keys(selectedKeyMap).length > 0
        ? selectedKeyMap
        : keys.reduce((acc, key) => {
            // eslint-disable-next-line no-param-reassign
            acc[key] = true

            return acc
          }, {} as Record<string, boolean>)
    )

    setValue("attributeKeys", keys)

    setValue("attributeMap", result)
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

    const selectedKeyMap = getValues("selectedKeyMap")

    doc.querySelectorAll("*").forEach((node) => {
      const tag = node.tagName.toLowerCase()

      if (!selectedKeyMap[tag]) {
        node.remove()
      }
    })

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

          setValue("html", data)
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
        <Popover.Root>
          <Popover.Trigger>
            <button type="button" className="button">
              {Object.keys(watch("selectedKeyMap")).length} attributes selected
            </button>
          </Popover.Trigger>
          <Popover.Portal>
            <Popover.Content className="space-y-4 rounded bg-slate-800 p-4 shadow">
              {watch("attributeKeys").map((key) => (
                <div key={key}>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      className="h-4 w-4"
                      {...register(`selectedKeyMap.${key}`)}
                      value={key}
                    />
                    <span>{key}</span>
                  </label>
                </div>
              ))}
            </Popover.Content>
          </Popover.Portal>
        </Popover.Root>
        <button type="button" className="button" onClick={handleCopy}>
          Copy
        </button>
      </div>
      <DiffEditor
        language="html"
        theme="vs-dark"
        original={controlledHtml}
        modified={controlledHtml}
        height={800}
        onMount={handleOnMount}
        options={EDITOR_OPTIONS}
      />
    </div>
  )
}
