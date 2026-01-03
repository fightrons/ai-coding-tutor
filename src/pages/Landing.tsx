import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { SplashScreen } from '@/shared/components/SplashScreen'
import { useIdentity, useAccessCode } from '@/modules/auth'
import logo from '@/assets/logo.png'

const MINIMUM_SPLASH_DURATION = 2000 // 2 second

export function Landing() {
  const navigate = useNavigate()
  const { isAuthenticated, loading } = useIdentity()
  const { createProfile, validateCode } = useAccessCode()

  const [showCodeInput, setShowCodeInput] = useState(false)
  const [codeInput, setCodeInput] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [isValidating, setIsValidating] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [minTimeElapsed, setMinTimeElapsed] = useState(false)

  // Ensure splash shows for minimum duration
  useEffect(() => {
    const timer = setTimeout(() => {
      setMinTimeElapsed(true)
    }, MINIMUM_SPLASH_DURATION)

    return () => clearTimeout(timer)
  }, [])

  // Auto-redirect if already authenticated (after splash completes)
  useEffect(() => {
    if (!loading && minTimeElapsed && isAuthenticated) {
      navigate('/learn')
    }
  }, [loading, minTimeElapsed, isAuthenticated, navigate])

  async function handleStartLearning() {
    setIsCreating(true)
    setMessage(null)

    try {
      const { error } = await createProfile()
      setIsCreating(false)

      if (error) {
        setMessage({ type: 'error', text: error })
        return
      }

      navigate('/learn')
    } catch (err) {
      setIsCreating(false)
      setMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Something went wrong. Please try again.',
      })
    }
  }

  async function handleCodeSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!codeInput.trim()) return

    setIsValidating(true)
    setMessage(null)
    const valid = await validateCode(codeInput)
    setIsValidating(false)

    if (valid) {
      navigate('/learn')
    } else {
      setMessage({
        type: 'error',
        text: 'This code is not recognized. It may have expired or been entered incorrectly.',
      })
    }
  }

  // Show splash screen until both: auth loaded AND minimum time elapsed
  if (loading || !minTimeElapsed) {
    return <SplashScreen />
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 relative">
      <h1 className="text-4xl font-bold mb-2">Learn Programming</h1>
      <p className="text-lg text-muted-foreground mb-2 text-center max-w-md">
        Build a strong foundation with JavaScript
      </p>
      <p className="text-muted-foreground mb-2 text-center max-w-md">
        An adaptive AI tutor that teaches you step-by-step.
      </p>
      <p className="text-sm text-muted-foreground mb-8">
        No sign-up required. Start learning for free.
      </p>

      <div className="flex flex-col gap-4 w-full max-w-xs">
        {/* Primary action: Start Learning */}
        <Button
          onClick={handleStartLearning}
          disabled={isCreating}
          size="lg"
          className="w-full cursor-pointer"
        >
          {isCreating ? 'Starting...' : 'Start Learning'}
        </Button>

        {/* Code entry toggle/form */}
        {!showCodeInput ? (
          <button
            onClick={() => setShowCodeInput(true)}
            className="text-sm text-muted-foreground hover:text-foreground hover:underline cursor-pointer"
          >
            Already learning? Enter your code
          </button>
        ) : (
          <form onSubmit={handleCodeSubmit} className="space-y-2">
            <Input
              value={codeInput}
              onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
              placeholder="SWIFT-BEAR-73"
              className="text-center uppercase"
              autoFocus
            />
            <div className="flex gap-2">
              <Button
                type="submit"
                variant="outline"
                className="flex-1"
                disabled={isValidating || !codeInput.trim()}
              >
                {isValidating ? 'Checking...' : 'Continue'}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setShowCodeInput(false)
                  setCodeInput('')
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        )}

        {/* Error/success message */}
        {message && (
          <p className={`text-sm text-center ${message.type === 'error' ? 'text-destructive' : 'text-green-600'}`}>
            {message.text}
          </p>
        )}

        {/* Secondary: Sign In / Create Account */}
        <div className="flex gap-2 justify-center text-sm text-muted-foreground pt-4">
          <Link to="/login" className="hover:text-foreground hover:underline">
            Sign In
          </Link>
          <span>|</span>
          <Link to="/signup" className="hover:text-foreground hover:underline">
            Create Account
          </Link>
        </div>
      </div>

      <img src={logo} alt="AI Coding Tutor" className="h-5 w-auto absolute bottom-4 right-4" />
    </div>
  )
}
