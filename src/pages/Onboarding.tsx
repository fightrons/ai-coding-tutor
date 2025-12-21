import { OnboardingForm, useStudentProfile } from '@/modules/auth'
import { Skeleton } from '@/shared/components/ui/skeleton'
import logo from '@/assets/logo.png'

export function Onboarding() {
  const { loading } = useStudentProfile()

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 relative">
        <div className="w-full max-w-md space-y-4">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
        <img src={logo} alt="AI Coding Tutor" className="h-5 w-auto absolute bottom-4 right-4" />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 relative">
      <div className="w-full max-w-md">
        <OnboardingForm />
      </div>
      <img src={logo} alt="AI Coding Tutor" className="h-5 w-auto absolute bottom-4 right-4" />
    </div>
  )
}
