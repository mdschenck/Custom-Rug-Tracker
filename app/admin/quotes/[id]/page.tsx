import { redirect, notFound } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { QuoteForm, QuoteFormData } from '@/components/QuoteForm'
import { Quote } from '@/lib/types'

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

async function deleteQuote(id: string) {
  'use server'
  const supabase = await createServiceClient()

  const { error } = await supabase
    .from('quotes')
    .delete()
    .eq('id', id)

  if (error) {
    throw new Error(error.message)
  }
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
    await deleteQuote(id)
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-semibold text-jl-charcoal mb-6">
        Edit Quote
      </h1>

      <div className="bg-white rounded-lg shadow-sm border border-jl-border p-6">
        <QuoteForm
          quote={quote as Quote}
          onSubmit={handleSubmit}
          onDelete={handleDelete}
        />
      </div>
    </div>
  )
}
