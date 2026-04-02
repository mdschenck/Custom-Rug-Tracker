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

  // Fetch current quote to detect changes
  const { data: currentQuote } = await supabase
    .from('quotes')
    .select('*')
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

  // Track all field changes for the general update log
  const changedFields: string[] = []

  // Check for status changes
  if (data.status && data.status !== currentQuote.status) {
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

  // Check for CAD file URL changes
  if ((data.cad_file_url || null) !== (currentQuote.cad_file_url || null)) {
    const label = !currentQuote.cad_file_url ? 'CAD file added' : !data.cad_file_url ? 'CAD file removed' : 'CAD file updated'
    changedFields.push(label)
  }

  // Check for Image Render URL changes
  if ((data.image_render_url || null) !== (currentQuote.image_render_url || null)) {
    const label = !currentQuote.image_render_url ? 'Image added' : !data.image_render_url ? 'Image removed' : 'Image updated'
    changedFields.push(label)
  }

  // Check for Documents URL changes
  if ((data.documents_url || null) !== (currentQuote.documents_url || null)) {
    const label = !currentQuote.documents_url ? 'Documents added' : !data.documents_url ? 'Documents removed' : 'Documents updated'
    changedFields.push(label)
  }

  // Check for other field changes
  if (data.customer_name !== currentQuote.customer_name) changedFields.push('customer name')
  if (data.customer_number !== currentQuote.customer_number) changedFields.push('customer number')
  if (data.customer_company !== currentQuote.customer_company) changedFields.push('customer company')
  if ((data.product_name || null) !== (currentQuote.product_name || null)) changedFields.push('product name')
  if ((data.sales_order_number || null) !== (currentQuote.sales_order_number || null)) changedFields.push('sales order number')
  if ((data.custom_rug_sku || null) !== (currentQuote.custom_rug_sku || null)) changedFields.push('custom rug SKU')
  if (data.cad_requested !== currentQuote.cad_requested) changedFields.push(data.cad_requested ? 'CAD requested' : 'CAD request removed')
  if (data.cad_approved !== currentQuote.cad_approved) changedFields.push(data.cad_approved ? 'CAD approved' : 'CAD approval removed')
  if (data.swatch_approved !== currentQuote.swatch_approved) changedFields.push(data.swatch_approved ? 'swatch approved' : 'swatch approval removed')
  if ((data.swatch_approved_by || null) !== (currentQuote.swatch_approved_by || null)) changedFields.push('swatch approver')

  // Create a general update log if any non-status fields changed
  if (changedFields.length > 0) {
    const details = `Updated: ${changedFields.join(', ')}`
    notesToAdd.push({
      quote_id: id,
      content: details,
      created_by: userEmail,
    })
    logsToAdd.push({
      action_type: 'quote_updated',
      quote_id: id,
      quote_number: currentQuote.quote_number,
      performed_by: userEmail,
      details,
    })
  }

  // Insert notes and logs
  if (notesToAdd.length > 0) {
    const noteResult = await supabase.from('quote_notes').insert(notesToAdd)
    if (noteResult.error) console.error('Failed to insert notes:', noteResult.error)
  }
  if (logsToAdd.length > 0) {
    const logResult = await supabase.from('activity_logs').insert(logsToAdd)
    if (logResult.error) console.error('Failed to insert activity logs:', logResult.error)
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
  const logResult = await supabase.from('activity_logs').insert(deleteLog)
  if (logResult.error) console.error('Failed to insert deletion log:', logResult.error)
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
