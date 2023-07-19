"use client"

import {
  ArchiveBoxArrowDownIcon,
  ArrowUturnLeftIcon,
  ArrowUturnRightIcon,
  BoltIcon,
  BoltSlashIcon,
  BookmarkSlashIcon,
  ClipboardDocumentCheckIcon,
  CommandLineIcon,
  SparklesIcon,
  ViewColumnsIcon,
} from "@heroicons/react/24/outline"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  DiffEditor,
  DiffEditorProps,
  DiffOnMount,
  Editor,
  EditorProps,
  OnMount,
} from "@monaco-editor/react"
import copy from "copy-to-clipboard"
import type { editor } from "monaco-editor"
import { Fragment, useRef } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"

import FormInput from "@/app/(common)/FormInput"

import EditorButton from "./EditorButton"
import { formatEditorValue, loopThroughHtmlNodes, updateEditorValue } from "./service"

enum EditorMode {
  Code,
  Diff,
}

interface HtmlEditorProps {
  html: string
}

const DEFAULT_EDITOR_PROPS = {
  language: "html",
  theme: "vs-dark",
  height: 800,
  options: {
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
  },
} satisfies DiffEditorProps & EditorProps

const editorSchema = z.object({
  isAnalysed: z.boolean(),
  mode: z.nativeEnum(EditorMode),
  remoteUrl: z.string().url().optional(),
  tags: z.array(z.string()),
  attributes: z.array(z.string()),
  tagMap: z.record(
    z.string(),
    z.object({
      count: z.number().optional(),
      selected: z.boolean().optional(),
      attributes: z.record(
        z.string(),
        z.object({
          count: z.number().optional(),
          selected: z.boolean().optional(),
        })
      ),
    })
  ),
})

type EditorSchema = z.infer<typeof editorSchema>

export default function HtmlEditor({ html }: HtmlEditorProps) {
  const { register, setError, getValues, setValue, formState, handleSubmit, watch } =
    useForm<EditorSchema>({
      resolver: zodResolver(editorSchema),
      defaultValues: {
        isAnalysed: false,
        mode: EditorMode.Code,
        remoteUrl: "",
        tags: [],
        tagMap: {},
        attributes: [],
      },
    })

  const isDiff = watch("mode") === EditorMode.Diff

  const htmlCopyRef = useRef<string | undefined>()
  const savedHtmlRef = useRef<string | undefined>()

  const diffEditorRef = useRef<editor.IStandaloneDiffEditor | null>(null)
  const codeEditorRef = useRef<editor.IStandaloneCodeEditor | null>(null)

  const handleOnDiffMount: DiffOnMount = (editor) => {
    diffEditorRef.current = editor

    if (savedHtmlRef.current) {
      diffEditorRef.current.getOriginalEditor().setValue(savedHtmlRef.current)
      savedHtmlRef.current = undefined
    }

    if (htmlCopyRef.current) {
      diffEditorRef.current.getModifiedEditor().setValue(htmlCopyRef.current)
      htmlCopyRef.current = undefined
    }
  }

  const handleOnCodeMount: OnMount = (editor) => {
    codeEditorRef.current = editor

    if (htmlCopyRef.current) {
      codeEditorRef.current.setValue(htmlCopyRef.current)
      htmlCopyRef.current = undefined
    }
  }

  const getEditor = () =>
    isDiff ? diffEditorRef.current?.getModifiedEditor() : codeEditorRef.current

  const handleSaveForComparison = () => {
    if (!diffEditorRef.current) {
      savedHtmlRef.current = codeEditorRef.current?.getValue()
      return
    }

    const newHtml = diffEditorRef.current.getModifiedEditor().getValue()

    diffEditorRef.current.getOriginalEditor().setValue(newHtml)
  }

  const handleFormat = () => formatEditorValue(getEditor())

  const handleAnalyse = () => {
    const newHtml = getEditor()?.getValue()

    if (!newHtml) return

    const tagMap: EditorSchema["tagMap"] = {}
    const orderedTagSet = new Set<string>()
    const orderedAttributeSet = new Set<string>()

    loopThroughHtmlNodes(newHtml, (node) => {
      const tag = node.tagName.toLowerCase()

      orderedTagSet.add(tag)

      if (!tagMap[tag]) {
        tagMap[tag] = {
          selected: false,
          attributes: {},
        }
      }

      tagMap[tag].count = (tagMap[tag].count || 0) + 1

      node.getAttributeNames().forEach((attribute) => {
        orderedAttributeSet.add(attribute)

        if (!tagMap[tag].attributes[attribute]) {
          tagMap[tag].attributes[attribute] = {
            selected: false,
          }
        }

        tagMap[tag].attributes[attribute].count = (tagMap[tag].attributes[attribute].count || 0) + 1
      })
    })

    setValue("tagMap", tagMap)
    setValue("tags", [...orderedTagSet])
    setValue("attributes", [...orderedAttributeSet])
    setValue("isAnalysed", true)
  }

  const handleRedo = () => {
    const editor = getEditor()

    if (!editor) return

    editor.trigger("redo", "redo", null)
  }

  const handleUndo = () => {
    const editor = getEditor()

    if (!editor) return

    editor.trigger("undo", "undo", null)
  }

  const handleCopy = () => {
    const newHtml = getEditor()
      ?.getValue({
        preserveBOM: false,
        lineEnding: "",
      })
      .replaceAll(/(&nbsp;|\n)/g, "")
      .replaceAll(/>\s+</g, "><")

    if (!newHtml) return

    copy(newHtml)
  }

  const handleFetchRemoteUrl = handleSubmit(async (values) => {
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

    const editor = getEditor()

    if (!editor) return

    updateEditorValue(editor, data)
    setValue("isAnalysed", false)
  }, console.error)

  const handleToggleMode = () => {
    const editor = getEditor()

    if (!editor) return

    htmlCopyRef.current = editor.getValue()

    setValue("mode", isDiff ? EditorMode.Code : EditorMode.Diff)
  }

  const handleRemoveElements = () => {
    const editor = getEditor()

    if (!editor) return

    const tagMap = getValues("tagMap")

    const doc = loopThroughHtmlNodes(editor.getValue(), (node) => {
      const tag = node.tagName.toLowerCase()

      if (tagMap[tag].selected) {
        node.remove()
      } else {
        node.getAttributeNames().forEach((attribute) => {
          if (tagMap[tag].attributes[attribute].selected) {
            node.removeAttribute(attribute)
          }
        })
      }
    })

    updateEditorValue(editor, doc.documentElement.outerHTML)

    formatEditorValue(editor)
  }

  const handleReplaceElements = () => {
    const editor = getEditor()

    if (!editor) return

    const tagMap = getValues("tagMap")

    const doc = loopThroughHtmlNodes(editor.getValue(), (node) => {
      const tag = node.tagName.toLowerCase()

      if (tagMap[tag].selected) {
        node.replaceWith(document.createElement(tag))
      } else {
        node.getAttributeNames().forEach((attribute) => {
          if (tagMap[tag].attributes[attribute].selected) {
            node.setAttribute(attribute, "")
          }
        })
      }
    })

    updateEditorValue(editor, doc.documentElement.outerHTML)

    formatEditorValue(editor)
  }

  const handleUnselectAll = () => {
    const newTagMap = { ...getValues("tagMap") }

    Object.keys(newTagMap).forEach((tag) => {
      newTagMap[tag].selected = false

      Object.keys(newTagMap[tag].attributes).forEach((attribute) => {
        newTagMap[tag].attributes[attribute].selected = false
      })
    })

    setValue("tagMap", newTagMap)
  }

  const tagMap = watch("tagMap")
  const isAnalysed = watch("isAnalysed")

  return (
    <div className="space-y-4">
      <form
        className="mb-20 flex flex-col items-center justify-center gap-4"
        onSubmit={handleFetchRemoteUrl}
      >
        <div className="join">
          <FormInput
            className="join-item w-full"
            type="url"
            register={register}
            name="remoteUrl"
            label="Remote URL"
            errors={formState.errors}
          />
          <button
            className="btn-primary join-item btn"
            type="submit"
            disabled={formState.isSubmitting}
          >
            {formState.isSubmitting && <span className="loading loading-spinner" />}
            Fetch URL
          </button>
        </div>
      </form>
      <div className="flex flex-col rounded-md bg-vscode-dark px-0.5 pb-2">
        <aside className="mx-2 flex items-end justify-between gap-2 py-2">
          <div className="join">
            <EditorButton
              tooltip="Analyse HTML contents"
              Icon={isAnalysed ? BoltIcon : BoltSlashIcon}
              onClick={handleAnalyse}
            />

            {isAnalysed && (
              <details className="dropdown-hover dropdown">
                <summary className="btn-primary btn-sm btn rounded-r-md">Attributes</summary>
                <div className="dropdown-content menu z-50 rounded-md border border-base-200 bg-base-100 p-0 shadow-sm">
                  <div>
                    <div className="menu-title inline-flex w-full items-center justify-between gap-2 whitespace-nowrap">
                      <h3>Tags & Attributes</h3>
                      <div className="tooltip-accent tooltip" data-tip="Unselect all">
                        <button
                          type="button"
                          onClick={handleUnselectAll}
                          className="btn-brand btn-xs btn-circle btn"
                        >
                          <BookmarkSlashIcon className="w-4" />
                        </button>
                      </div>
                    </div>
                    <ul className="max-h-[300px] overflow-x-hidden px-2">
                      {watch("tags").map((tag) => (
                        <Fragment key={tag}>
                          <li className="form-control relative">
                            <label className="label">
                              <span className="label-text-alt relative font-semibold">
                                {tagMap[tag].count}
                                <span className="badge badge-md ml-2">{tag}</span>
                              </span>
                              <input
                                type="checkbox"
                                className="checkbox-primary checkbox checkbox-xs"
                                {...register(`tagMap.${tag}.selected`)}
                              />
                            </label>
                          </li>
                          {Object.keys(tagMap[tag].attributes).map((attribute) => (
                            <li key={tag + attribute} className="form-control relative pl-2">
                              <label className="label">
                                <span className="label-text-alt relative">
                                  {tagMap[tag].attributes[attribute].count}
                                  <span className="badge badge-sm ml-2">{attribute}</span>
                                </span>
                                <input
                                  type="checkbox"
                                  className="checkbox-accent checkbox checkbox-xs"
                                  defaultChecked={false}
                                  {...register(`tagMap.${tag}.attributes.${attribute}.selected`)}
                                />
                              </label>
                            </li>
                          ))}
                        </Fragment>
                      ))}
                      <li className="menu-title whitespace-nowrap">Select All Attributes</li>
                      <li className="flex w-full flex-row flex-wrap gap-1">
                        {watch("attributes").map((attribute) => {
                          const handleSelectAttribute = () => {
                            const newTagMap = { ...getValues("tagMap") }

                            Object.keys(newTagMap).forEach((tag) => {
                              Object.keys(newTagMap[tag].attributes).forEach((attr) => {
                                if (attr === attribute) {
                                  newTagMap[tag].attributes[attr].selected = true
                                }
                              })
                            })

                            setValue("tagMap", newTagMap)
                          }

                          return (
                            <button
                              key={attribute}
                              type="button"
                              className="badge badge-sm inline-flex cursor-pointer"
                              onClick={handleSelectAttribute}
                            >
                              {attribute}
                            </button>
                          )
                        })}
                      </li>
                    </ul>
                    <div className="flex flex-col gap-1.5 whitespace-nowrap bg-base-200 p-2">
                      <button
                        type="button"
                        className="btn-brand btn-sm btn w-full"
                        onClick={handleRemoveElements}
                      >
                        Remove selected
                      </button>
                      <button
                        type="button"
                        className="btn-brand btn-sm btn w-full"
                        onClick={handleReplaceElements}
                      >
                        Replace selected
                      </button>
                    </div>
                  </div>
                </div>
              </details>
            )}
          </div>
          <div className="join">
            <EditorButton tooltip="Redo" onClick={handleRedo} Icon={ArrowUturnRightIcon} />
            <EditorButton tooltip="Undo" onClick={handleUndo} Icon={ArrowUturnLeftIcon} />
            <EditorButton tooltip="Format source code" onClick={handleFormat} Icon={SparklesIcon} />
            <EditorButton
              tooltip="Save for comparison"
              onClick={handleSaveForComparison}
              Icon={ArchiveBoxArrowDownIcon}
            />
            <EditorButton
              tooltip={isDiff ? "Toggle Code Mode" : "Toggle Diff Mode"}
              onClick={handleToggleMode}
              Icon={isDiff ? ViewColumnsIcon : CommandLineIcon}
            />
            <EditorButton
              tooltip="Copy source code"
              onClick={handleCopy}
              Icon={ClipboardDocumentCheckIcon}
            />
          </div>
        </aside>
        {isDiff ? (
          <DiffEditor
            {...DEFAULT_EDITOR_PROPS}
            original={html}
            modified={html}
            onMount={handleOnDiffMount}
          />
        ) : (
          <Editor {...DEFAULT_EDITOR_PROPS} defaultValue={html} onMount={handleOnCodeMount} />
        )}
      </div>
    </div>
  )
}
