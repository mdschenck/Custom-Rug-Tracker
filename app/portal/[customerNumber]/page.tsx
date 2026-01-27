import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Quote } from '@/lib/types'
import { CustomerQuotesTable } from './CustomerQuotesTable'

interface PageProps {
  params: Promise<{ customerNumber: string }>
}

export default async function CustomerQuotesPage({ params }: PageProps) {
  const { customerNumber } = await params
  const decodedCustomerNumber = decodeURIComponent(customerNumber)
  const supabase = await createClient()

  const { data: quotes, error } = await supabase
    .from('quotes')
    .select('*')
    .eq('customer_number', decodedCustomerNumber)
    .order('created_at', { ascending: false })

  if (error) {
    return (
      <div className="p-8">
        <div className="text-red-600">Error loading quotes. Please try again.</div>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-jl-charcoal">
              My Custom Rug Quotes
            </h1>
            <p className="text-jl-muted mt-1">
              Customer: {decodedCustomerNumber}
            </p>
          </div>
          <Link
            href="/portal"
            className="text-sm text-jl-secondary hover:text-jl-charcoal underline"
          >
            Change Customer
          </Link>
        </div>

        {quotes && quotes.length > 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-jl-border overflow-hidden">
            <CustomerQuotesTable quotes={quotes as Quote[]} />
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-jl-border p-12 text-center">
            <p className="text-jl-muted">
              No quotes found for customer number: {decodedCustomerNumber}
            </p>
            <Link
              href="/portal"
              className="inline-block mt-4 text-sm text-jl-charcoal hover:underline"
            >
              Try a different customer number
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
