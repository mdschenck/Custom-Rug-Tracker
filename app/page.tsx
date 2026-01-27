import Link from 'next/link'
import { Button } from '@/components/ui'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-jl-offwhite flex items-center justify-center">
      <div className="text-center space-y-8">
        <div>
          <h1 className="text-3xl font-semibold text-jl-charcoal">
            Custom Rug Quote Tracker
          </h1>
          <p className="mt-2 text-jl-muted">
            Jaipur Living Custom Rug Management System
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/admin">
            <Button size="lg">
              Admin Portal
            </Button>
          </Link>
          <Link href="/portal">
            <Button size="lg" variant="outline">
              Customer Portal
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
