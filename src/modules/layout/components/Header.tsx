import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ChevronDown } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu'
import { Avatar } from '@/shared/components/Avatar'
import { useAuth, useStudentProfile, ChangePasswordDialog } from '@/modules/auth'
import logo from '@/assets/logo.png'

export function Header() {
  const navigate = useNavigate()
  const { signOut } = useAuth()
  const { profile } = useStudentProfile()
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false)

  async function handleSignOut() {
    await signOut()
    navigate('/')
  }

  return (
    <>
      <header className="border-b">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/learn" className="flex flex-col items-center gap-1">
            <img src={logo} alt="AI Coding Tutor" className="h-4 w-auto mt-2" />
            <span className="text-xs">AI Coding Tutor</span>
          </Link>

          <DropdownMenu>
            <DropdownMenuTrigger className="cursor-pointer outline-none flex items-center gap-1">
              <Avatar emoji={profile?.avatar_emoji} size="sm" />
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild className="cursor-pointer">
                <Link to="/profile">Profile</Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer"
                onSelect={() => setPasswordDialogOpen(true)}
              >
                Change Password
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="cursor-pointer"
                onSelect={handleSignOut}
              >
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <ChangePasswordDialog
        open={passwordDialogOpen}
        onOpenChange={setPasswordDialogOpen}
      />
    </>
  )
}
