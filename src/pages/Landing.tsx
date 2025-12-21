import { Link } from 'react-router-dom'
import { Button } from '@/shared/components/ui/button'
import logo from '@/assets/logo.png'

export function Landing() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 relative">
      <h1 className="text-4xl font-bold mb-4">Learn JavaScript</h1>
      <p className="text-muted-foreground mb-8 text-center max-w-md">
        An adaptive AI tutor that teaches you programming step-by-step.
      </p>
      <div className="flex gap-4">
        <Button asChild>
          <Link to="/signup">Get Started</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link to="/login">Sign In</Link>
        </Button>
      </div>
      <img src={logo} alt="AI Coding Tutor" className="h-5 w-auto absolute bottom-4 right-4" />
    </div>
  )
}
