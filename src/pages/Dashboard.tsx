import { Link } from 'react-router-dom'
import { Button } from '@/shared/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription } from '@/shared/components/ui/card'
import { Header } from '@/modules/layout'

export function Dashboard() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold mb-6">Your Progress</h1>
          <div className="space-y-4">
            {/* Progress cards will be rendered from lesson module */}
            <Card>
              <CardHeader>
                <CardTitle>Variables and Types</CardTitle>
                <CardDescription>Learn how to store and work with data</CardDescription>
              </CardHeader>
            </Card>
            <Button asChild>
              <Link to="/learn/variables-intro">Continue Learning</Link>
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
}
