import { Link } from 'react-router-dom'
import { Button } from '@/shared/components/ui/button'
import { SignupForm } from '@/modules/auth'
import logo from '@/assets/logo.png'

export function Signup() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 relative">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Create your account</h1>
          <p className="text-muted-foreground mt-1">Start learning JavaScript today</p>
        </div>

        <SignupForm />

        <p className="text-sm text-center">
          Already have an account?{' '}
          <Link to="/login" className="text-primary underline">
            Sign in
          </Link>
        </p>

        <Button variant="ghost" asChild className="w-full">
          <Link to="/">Back to home</Link>
        </Button>
      </div>
      <img src={logo} alt="AI Coding Tutor" className="h-5 w-auto absolute bottom-4 right-4" />
    </div>
  )
}
