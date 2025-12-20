import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/shared/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Avatar } from '@/shared/components/Avatar'
import { AvatarPicker } from '@/shared/components/AvatarPicker'
import { Header } from '@/modules/layout'
import { useStudentProfile } from '@/modules/auth'

export function Profile() {
  const { profile, updateProfile } = useStudentProfile()
  const [editingAvatar, setEditingAvatar] = useState(false)
  const [saving, setSaving] = useState(false)

  async function handleAvatarChange(emoji: string) {
    setSaving(true)
    await updateProfile({ avatar_emoji: emoji })
    setSaving(false)
    setEditingAvatar(false)
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 p-8">
        <div className="max-w-2xl mx-auto space-y-6">
          <h1 className="text-2xl font-bold">Profile</h1>

          <Card>
            <CardHeader>
              <CardTitle>Your Avatar</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {editingAvatar ? (
                <>
                  <AvatarPicker
                    value={profile?.avatar_emoji || '😊'}
                    onChange={handleAvatarChange}
                  />
                  <Button
                    variant="outline"
                    onClick={() => setEditingAvatar(false)}
                    disabled={saving}
                  >
                    Cancel
                  </Button>
                </>
              ) : (
                <div className="flex items-center gap-4">
                  <Avatar emoji={profile?.avatar_emoji} size="lg" />
                  <Button variant="outline" onClick={() => setEditingAvatar(true)}>
                    Change Avatar
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Learning Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Goal</span>
                <span>{profile?.learning_goal?.replace('_', ' ')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Experience</span>
                <span>{profile?.prior_experience?.replace('_', ' ')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Learning style</span>
                <span>{profile?.preferred_style}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Skill level</span>
                <span>{profile?.current_skill_level}</span>
              </div>
            </CardContent>
          </Card>

          <Button variant="outline" asChild>
            <Link to="/learn">Back to Dashboard</Link>
          </Button>
        </div>
      </main>
    </div>
  )
}
