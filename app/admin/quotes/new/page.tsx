import { redirect } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { QuoteForm, QuoteFormData } from '@/components/QuoteForm'
import { ActivityLogInsert, QuoteNoteInsert } from '@/lib/types'

async function createQuote(data: QuoteFormData, userEmail: string) {
  'use server'
  const supabase = await createServiceClient()

  const { data: quote, error } = await supabase
    .from('quotes')
    .insert(data)
    .select('id, quote_number, customer_name, customer_company')
    .single()

  if (error) {
    throw new Error(error.message)
  }

  // Log the creation
  const note: QuoteNoteInsert = {
    quote_id: quote.id,
    content: `Quote created by ${userEmail}`,
    created_by: userEmail,
  }
  const activityLog: ActivityLogInsert = {
    action_type: 'quote_created',
    quote_id: quote.id,
    quote_number: quote.quote_number,
    performed_by: userEmail,
    details: `Created quote for ${quote.customer_name} (${quote.customer_company})`,
  }

  const [noteResult, logResult] = await Promise.all([
    supabase.from('quote_notes').insert(note),
    supabase.from('activity_logs').insert(activityLog),
  ])

  if (noteResult.error) console.error('Failed to insert creation note:', noteResult.error)
  if (logResult.error) console.error('Failed to insert creation log:', logResult.error)
}

export default async function NewQuotePage() {
  const supabase = await createClient()

  // Check auth
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/admin/login')
  }

  const handleSubmit = async (data: QuoteFormData) => {
    'use server'
    await createQuote(data, user.email || 'Admin')
  }

  return (
    <div className="mx-auto px-4 sm:px-6 lg:px-8 py-6" style={{ maxWidth: '1200px' }}>
      <h1 className="text-2xl font-semibold text-jl-charcoal mb-4">
        Create New Quote
      </h1>

      <div className="bg-white rounded-lg shadow-sm border border-jl-border p-4">
        <QuoteForm onSubmit={handleSubmit} adminEmail={user.email} />
      </div>
    </div>
  )
}
