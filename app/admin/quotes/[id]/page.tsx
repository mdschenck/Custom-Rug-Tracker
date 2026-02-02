import { redirect, notFound } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { QuoteForm, QuoteFormData } from '@/components/QuoteForm'
import { Quote, ActivityLogInsert, QuoteNoteInsert } from '@/lib/types'

interface PageProps {
  params: Promise<{ id: string }>
}

async function updateQuote(id: string, data: QuoteFormData, userEmail: string) {
  'use server'
  const supabase = await createServiceClient()

  // Fetch current quote to detect URL changes
  const { data: currentQuote } = await supabase
    .from('quotes')
    .select('quote_number, cad_file_url, image_render_url, documents_url, status')
    .eq('id', id)
    .single()

  const { error } = await supabase
    .from('quotes')
    .update(data)
    .eq('id', id)

  if (error) {
    throw new Error(error.message)
  }

  if (!currentQuote) return

  const notesToAdd: QuoteNoteInsert[] = []
  const logsToAdd: ActivityLogInsert[] = []

  // Check for CAD file URL changes
  if (data.cad_file_url && !currentQuote.cad_file_url) {
    notesToAdd.push({
      quote_id: id,
      content: 'CAD file added',
      created_by: userEmail,
    })
    logsToAdd.push({
      action_type: 'quote_updated',
      quote_id: id,
      quote_number: currentQuote.quote_number,
      performed_by: userEmail,
      details: 'CAD file added',
    })
  } else if (data.cad_file_url && currentQuote.cad_file_url && data.cad_file_url !== currentQuote.cad_file_url) {
    notesToAdd.push({
      quote_id: id,
      content: 'CAD file updated',
      created_by: userEmail,
    })
    logsToAdd.push({
      action_type: 'quote_updated',
      quote_id: id,
      quote_number: currentQuote.quote_number,
      performed_by: userEmail,
      details: 'CAD file updated',
    })
  }

  // Check for Image Render URL changes
  if (data.image_render_url && !currentQuote.image_render_url) {
    notesToAdd.push({
      quote_id: id,
      content: 'Image added',
      created_by: userEmail,
    })
    logsToAdd.push({
      action_type: 'quote_updated',
      quote_id: id,
      quote_number: currentQuote.quote_number,
      performed_by: userEmail,
      details: 'Image added',
    })
  } else if (data.image_render_url && currentQuote.image_render_url && data.image_render_url !== currentQuote.image_render_url) {
    notesToAdd.push({
      quote_id: id,
      content: 'Image updated',
      created_by: userEmail,
    })
    logsToAdd.push({
      action_type: 'quote_updated',
      quote_id: id,
      quote_number: currentQuote.quote_number,
      performed_by: userEmail,
      details: 'Image updated',
    })
  }

  // Check for Documents URL changes
  if (data.documents_url && !currentQuote.documents_url) {
    notesToAdd.push({
      quote_id: id,
      content: 'Documents added',
      created_by: userEmail,
    })
    logsToAdd.push({
      action_type: 'quote_updated',
      quote_id: id,
      quote_number: currentQuote.quote_number,
      performed_by: userEmail,
      details: 'Documents added',
    })
  } else if (data.documents_url && currentQuote.documents_url && data.documents_url !== currentQuote.documents_url) {
    notesToAdd.push({
      quote_id: id,
      content: 'Documents updated',
      created_by: userEmail,
    })
    logsToAdd.push({
      action_type: 'quote_updated',
      quote_id: id,
      quote_number: currentQuote.quote_number,
      performed_by: userEmail,
      details: 'Documents updated',
    })
  }

  // Check for status changes
  if (data.status && currentQuote.status && data.status !== currentQuote.status) {
    notesToAdd.push({
      quote_id: id,
      content: `Status changed from "${currentQuote.status}" to "${data.status}" by ${userEmail}`,
      created_by: userEmail,
    })
    logsToAdd.push({
      action_type: 'status_changed',
      quote_id: id,
      quote_number: currentQuote.quote_number,
      performed_by: userEmail,
      details: `Status changed from "${currentQuote.status}" to "${data.status}"`,
    })
  }

  // Insert notes and logs
  if (notesToAdd.length > 0) {
    await supabase.from('quote_notes').insert(notesToAdd)
  }
  if (logsToAdd.length > 0) {
    await supabase.from('activity_logs').insert(logsToAdd)
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
    await updateQuote(id, data, user.email || 'Admin')
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
