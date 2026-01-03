import { useRef, useEffect } from 'react'
import Editor, { type OnMount } from '@monaco-editor/react'
import type { editor } from 'monaco-editor'

interface CodeEditorProps {
  value: string
  onChange: (value: string) => void
  readOnly?: boolean
  /** Prevent auto-focus on mount (useful for mobile) */
  preventAutoFocus?: boolean
}

export function CodeEditor({ value, onChange, readOnly = false, preventAutoFocus = false }: CodeEditorProps) {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleMount: OnMount = (editor) => {
    editorRef.current = editor

    if (preventAutoFocus) {
      // Immediately blur any focused element
      ;(document.activeElement as HTMLElement)?.blur()

      // Override the focus method temporarily to prevent auto-focus
      const originalFocus = editor.focus.bind(editor)
      let focusBlocked = true

      editor.focus = () => {
        if (!focusBlocked) {
          originalFocus()
        }
      }

      // Re-enable focus after a short delay (allows user interaction)
      setTimeout(() => {
        focusBlocked = false
        editor.focus = originalFocus
      }, 500)
    }
  }

  // Blur on initial render for mobile
  useEffect(() => {
    if (preventAutoFocus) {
      const timer = setTimeout(() => {
        ;(document.activeElement as HTMLElement)?.blur()
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [preventAutoFocus])

  return (
    <div ref={containerRef} className="h-full">
      <Editor
        height="100%"
        language="javascript"
        theme="vs-dark"
        value={value}
        onChange={(val) => onChange(val || '')}
        onMount={handleMount}
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          fontFamily: "'JetBrains Mono', monospace",
          lineNumbers: 'on',
          scrollBeyondLastLine: false,
          automaticLayout: true,
          tabSize: 2,
          readOnly,
          wordWrap: 'on',
          padding: { top: 16 },
        }}
      />
    </div>
  )
}
