'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Input } from '@/components/ui'

export default function PortalLookupPage() {
  const router = useRouter()
  const [customerNumber, setCustomerNumber] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!customerNumber.trim()) return

    setLoading(true)
    router.push(`/portal/${encodeURIComponent(customerNumber.trim())}`)
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-12">
      <div className="w-full max-w-md px-4">
        <div className="bg-white rounded-lg shadow-sm border border-jl-border p-8">
          <h1 className="text-2xl font-semibold text-jl-charcoal text-center mb-2">
            Custom Rug Quotes
          </h1>
          <p className="text-jl-muted text-center mb-6">
            Enter your customer number to view your quotes
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Customer Number"
              value={customerNumber}
              onChange={(e) => setCustomerNumber(e.target.value)}
              placeholder="Enter your customer number"
              required
            />

            <Button
              type="submit"
              className="w-full"
              disabled={loading || !customerNumber.trim()}
            >
              {loading ? 'Loading...' : 'View My Quotes'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
