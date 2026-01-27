import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Quote } from '@/lib/types'
import { QUOTE_STATUSES } from '@/lib/constants'
import { Button } from '@/components/ui'
import { QuotesTable } from '@/components/QuotesTable'
import { QuotesFilter } from './QuotesFilter'

interface SearchParams {
  status?: string
  search?: string
}

export default async function AdminQuotesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const supabase = await createClient()

  // Check auth
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/admin/login')
  }

  const params = await searchParams
  const status = params.status
  const search = params.search

  // Build query
  let query = supabase
    .from('quotes')
    .select('*')
    .order('created_at', { ascending: false })

  if (status && status !== 'all') {
    query = query.eq('status', status)
  }

  if (search) {
    query = query.or(`customer_name.ilike.%${search}%,customer_number.ilike.%${search}%,quote_number.ilike.%${search}%`)
  }

  const { data: quotes, error } = await query

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-red-600">Error loading quotes: {error.message}</div>
      </div>
    )
  }

  const statusOptions = [
    { value: 'all', label: 'All Statuses' },
    ...QUOTE_STATUSES.map((s) => ({ value: s, label: s })),
  ]

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-jl-charcoal">Quotes</h1>
        <Link href="/admin/quotes/new">
          <Button>Create New Quote</Button>
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-jl-border">
        <div className="p-4 border-b border-jl-border">
          <QuotesFilter
            statusOptions={statusOptions}
            currentStatus={status || 'all'}
            currentSearch={search || ''}
          />
        </div>

        <QuotesTable quotes={quotes as Quote[]} isAdmin />
      </div>
    </div>
  )
}
