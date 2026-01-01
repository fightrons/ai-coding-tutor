import logo from '@/assets/logo.png'

interface SplashScreenProps {
  tagline?: string
}

export function SplashScreen({ tagline = 'Keep learning...' }: SplashScreenProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-8">
        {/* Logo */}
        <img
          src={logo}
          alt="AI Coding Tutor"
          className="h-10 w-auto animate-fade-in"
        />

        {/* Progress bar */}
        <div className="w-48 h-1 bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-primary rounded-full animate-progress" />
        </div>

        {/* Tagline */}
        <p className="text-sm text-muted-foreground animate-fade-in-delayed">
          {tagline}
        </p>
      </div>
    </div>
  )
}
