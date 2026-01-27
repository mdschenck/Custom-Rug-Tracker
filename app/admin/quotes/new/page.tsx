import { redirect } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { QuoteForm, QuoteFormData } from '@/components/QuoteForm'

async function createQuote(data: QuoteFormData) {
  'use server'
  const supabase = await createServiceClient()

  const { error } = await supabase.from('quotes').insert(data)

  if (error) {
    throw new Error(error.message)
  }
}

export default async function NewQuotePage() {
  const supabase = await createClient()

  // Check auth
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/admin/login')
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-semibold text-jl-charcoal mb-6">
        Create New Quote
      </h1>

      <div className="bg-white rounded-lg shadow-sm border border-jl-border p-6">
        <QuoteForm onSubmit={createQuote} />
      </div>
    </div>
  )
}
