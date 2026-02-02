import { redirect, notFound } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { QuoteForm, QuoteFormData } from '@/components/QuoteForm'
import { Quote, ActivityLogInsert } from '@/lib/types'

interface PageProps {
  params: Promise<{ id: string }>
}

async function updateQuote(id: string, data: QuoteFormData) {
  'use server'
  const supabase = await createServiceClient()

  const { error } = await supabase
    .from('quotes')
    .update(data)
    .eq('id', id)

  if (error) {
    throw new Error(error.message)
  }
}

async function deleteQuote(id: string, userEmail: string) {
  'use server'
  const supabase = await createServiceClient()

  // Get quote info before deleting for logging
  const { data: quote } = await supabase
    .from('quotes')
    .select('quote_number, customer_name')
    .eq('id', id)
    .single()

  const { error } = await supabase
    .from('quotes')
    .delete()
    .eq('id', id)

  if (error) {
    throw new Error(error.message)
  }

  // Log the deletion
  const deleteLog: ActivityLogInsert = {
    action_type: 'quote_deleted',
    quote_id: null,
    quote_number: quote?.quote_number || null,
    performed_by: userEmail,
    details: quote ? `Deleted quote ${quote.quote_number} for ${quote.customer_name}` : `Deleted quote ${id}`,
  }
  await supabase.from('activity_logs').insert(deleteLog)
}

export default async function EditQuotePage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  // Check auth
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/admin/login')
  }

  // Fetch quote
  const { data: quote, error } = await supabase
    .from('quotes')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !quote) {
    notFound()
  }

  const handleSubmit = async (data: QuoteFormData) => {
    'use server'
    await updateQuote(id, data)
  }

  const handleDelete = async () => {
    'use server'
    await deleteQuote(id, user.email || 'Admin')
  }

  return (
    <div className="mx-auto px-4 sm:px-6 lg:px-8 py-6" style={{ maxWidth: '1200px' }}>
      <h1 className="text-2xl font-semibold text-jl-charcoal mb-4">
        Quote Maintenance
      </h1>

      <div className="bg-white rounded-lg shadow-sm border border-jl-border p-4">
        <QuoteForm
          quote={quote as Quote}
          onSubmit={handleSubmit}
          onDelete={handleDelete}
          adminEmail={user.email}
        />
      </div>
    </div>
  )
}
