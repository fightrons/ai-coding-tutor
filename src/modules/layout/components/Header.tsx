import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/shared/components/ui/button'
import { Avatar } from '@/shared/components/Avatar'
import { useAuth, useStudentProfile } from '@/modules/auth'
import logo from '@/assets/logo.png'

export function Header() {
  const navigate = useNavigate()
  const { signOut } = useAuth()
  const { profile } = useStudentProfile()

  async function handleSignOut() {
    await signOut()
    navigate('/')
  }

  return (
    <header className="border-b">
      <div className="container mx-auto px-4 h-14 flex items-center justify-between">
        <Link to="/learn" className="flex items-center gap-2">
          <img src={logo} alt="AI Coding Tutor" className="h-4 w-auto" />
          <span className="text-sm">AI Coding Tutor</span>
        </Link>

        <div className="flex items-center gap-4">
          <Link to="/profile">
            <Avatar emoji={profile?.avatar_emoji} size="sm" />
          </Link>
          <Button variant="ghost" size="sm" onClick={handleSignOut}>
            Sign out
          </Button>
        </div>
      </div>
    </header>
  )
}
