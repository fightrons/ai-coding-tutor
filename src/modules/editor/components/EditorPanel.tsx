import { useState, useEffect, type ReactNode } from 'react'
import { Play, RotateCcw } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { CodeEditor } from './CodeEditor'
import { OutputPanel } from './OutputPanel'
import { useCodeRunner } from '../hooks/useCodeRunner'
import type { TestCase, ExecutionResult } from '../types'

interface EditorPanelProps {
  starterCode: string
  testCases: TestCase[]
  onAllTestsPass?: () => void
  onCodeChange?: (code: string) => void
  onResult?: (result: ExecutionResult) => void
  toolbarExtra?: ReactNode
  /** Controlled code value - when provided, parent manages state */
  code?: string
  /** Minimum height for editor section (useful for mobile) */
  minEditorHeight?: string
  /** Prevent editor from auto-focusing on mount (prevents keyboard on mobile) */
  preventAutoFocus?: boolean
}

export function EditorPanel({
  starterCode,
  testCases,
  onAllTestsPass,
  onCodeChange,
  onResult,
  toolbarExtra,
  code: controlledCode,
  minEditorHeight,
  preventAutoFocus,
}: EditorPanelProps) {
  // Support both controlled and uncontrolled modes
  const [internalCode, setInternalCode] = useState(starterCode)
  const isControlled = controlledCode !== undefined
  const code = isControlled ? controlledCode : internalCode

  const setCode = (newCode: string) => {
    if (!isControlled) {
      setInternalCode(newCode)
    }
    onCodeChange?.(newCode)
  }
  const { result, running, run, reset } = useCodeRunner()

  // Notify parent when result changes
  useEffect(() => {
    if (result) {
      onResult?.(result)
    }
  }, [result, onResult])

  // Notify parent when all tests pass
  useEffect(() => {
    if (result?.allPassed && onAllTestsPass) {
      onAllTestsPass()
    }
  }, [result?.allPassed, onAllTestsPass])

  function handleRun() {
    run(code, testCases)
  }

  function handleReset() {
    setCode(starterCode)
    reset()
  }

  return (
    <div className="h-full flex flex-col">
      {/* Toolbar */}
      <div className="flex items-center gap-2 p-2 border-b bg-muted/50">
        <Button size="sm" onClick={handleRun} disabled={running}>
          <Play className="h-4 w-4 mr-2" />
          Run Code
        </Button>
        <Button size="sm" variant="outline" onClick={handleReset} disabled={running}>
          <RotateCcw className="h-4 w-4 mr-2" />
          Reset
        </Button>
        {toolbarExtra && (
          <>
            <div className="flex-1" />
            {toolbarExtra}
          </>
        )}
      </div>

      {/* Editor */}
      <div className="flex-1 min-h-0" style={minEditorHeight ? { minHeight: minEditorHeight } : undefined}>
        <CodeEditor value={code} onChange={setCode} preventAutoFocus={preventAutoFocus} />
      </div>

      {/* Output */}
      <div className="h-48 border-t bg-background">
        <OutputPanel result={result} running={running} />
      </div>
    </div>
  )
}
