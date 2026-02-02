'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Quote, QuoteNote } from '@/lib/types'
import { QUOTE_STATUSES, QuoteStatus } from '@/lib/constants'
import { Button, Input, Select } from '@/components/ui'

export interface QuoteFormData {
  customer_name: string
  customer_number: string
  customer_company: string
  product_name: string | null
  documents_url: string | null
  cad_file_url: string | null
  image_render_url: string | null
  cad_requested: boolean
  cad_approved: boolean
  swatch_approved: boolean
  swatch_approved_by: string | null
  status: QuoteStatus
  sales_order_number: string | null
  custom_rug_sku: string | null
}

interface QuoteFormProps {
  quote?: Quote
  onSubmit: (data: QuoteFormData) => Promise<void>
  onDelete?: () => Promise<void>
  adminEmail?: string
}

export function QuoteForm({ quote, onSubmit, onDelete, adminEmail }: QuoteFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notes, setNotes] = useState<QuoteNote[]>([])
  const [newNote, setNewNote] = useState('')
  const [addingNote, setAddingNote] = useState(false)

  const [formData, setFormData] = useState({
    customer_name: quote?.customer_name || '',
    customer_number: quote?.customer_number || '',
    customer_company: quote?.customer_company || '',
    product_name: quote?.product_name || '',
    documents_url: quote?.documents_url || '',
    cad_file_url: quote?.cad_file_url || '',
    image_render_url: quote?.image_render_url || '',
    cad_requested: quote?.cad_requested || false,
    cad_approved: quote?.cad_approved || false,
    swatch_approved: quote?.swatch_approved || false,
    swatch_approved_by: quote?.swatch_approved_by || '',
    status: quote?.status || 'Inquiry' as QuoteStatus,
    sales_order_number: quote?.sales_order_number || '',
    custom_rug_sku: quote?.custom_rug_sku || '',
  })

  // Fetch notes when editing an existing quote
  useEffect(() => {
    if (quote?.id) {
      fetchNotes()
    }
  }, [quote?.id])

  const fetchNotes = async () => {
    if (!quote?.id) return
    try {
      const response = await fetch(`/api/quotes/${quote.id}/notes`)
      if (response.ok) {
        const data = await response.json()
        setNotes(data)
      }
    } catch (err) {
      console.error('Failed to fetch notes:', err)
    }
  }

  const handleAddNote = async () => {
    if (!quote?.id || !newNote.trim()) return

    setAddingNote(true)
    try {
      const response = await fetch(`/api/quotes/${quote.id}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newNote.trim() }),
      })

      if (response.ok) {
        const addedNote = await response.json()
        setNotes((prev) => [addedNote, ...prev])
        setNewNote('')
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to add note')
      }
    } catch (err) {
      setError('Failed to add note')
    } finally {
      setAddingNote(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    const checked = (e.target as HTMLInputElement).checked

    if (type === 'checkbox') {
      setFormData((prev) => ({ ...prev, [name]: checked }))
    } else if (name === 'status') {
      // When status changes to a pending state, reset the corresponding approval flags
      setFormData((prev) => {
        const updates: Partial<typeof prev> = { status: value as QuoteStatus }

        // Reset swatch approval when going back to Swatch Approval Pending
        if (value === 'Swatch Approval Pending') {
          updates.swatch_approved = false
          updates.swatch_approved_by = ''
        }

        // Reset CAD approval when going back to CAD Approval Pending
        if (value === 'CAD Approval Pending') {
          updates.cad_approved = false
        }

        return { ...prev, ...updates }
      })
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // Determine swatch_approved_by value
      let swatchApprovedBy: string | null = formData.swatch_approved_by || null
      // If swatch is being approved and no approver set, use admin email
      if (formData.swatch_approved && !quote?.swatch_approved && !swatchApprovedBy && adminEmail) {
        swatchApprovedBy = adminEmail
      }
      // If swatch is being unapproved, clear the approver
      if (!formData.swatch_approved) {
        swatchApprovedBy = null
      }

      const data: QuoteFormData = {
        customer_name: formData.customer_name,
        customer_number: formData.customer_number,
        customer_company: formData.customer_company,
        product_name: formData.product_name || null,
        documents_url: formData.documents_url || null,
        cad_file_url: formData.cad_file_url || null,
        image_render_url: formData.image_render_url || null,
        cad_requested: formData.cad_requested,
        cad_approved: formData.cad_approved,
        swatch_approved: formData.swatch_approved,
        swatch_approved_by: swatchApprovedBy,
        status: formData.status,
        sales_order_number: formData.sales_order_number || null,
        custom_rug_sku: formData.custom_rug_sku || null,
      }

      await onSubmit(data)
      router.push('/admin/quotes')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!onDelete) return
    if (!confirm('Are you sure you want to delete this quote?')) return

    setLoading(true)
    setError(null)

    try {
      await onDelete()
      router.push('/admin/quotes')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const formatNoteDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
  }

  const statusOptions = QUOTE_STATUSES.map((status) => ({
    value: status,
    label: status,
  }))

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm">
          {error}
        </div>
      )}

      {/* Quote Number and Status Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {quote && (
          <div className="p-3 bg-jl-offwhite rounded-md">
            <p className="text-xs text-jl-muted">Quote Number</p>
            <p className="text-base font-medium text-jl-charcoal">{quote.quote_number}</p>
          </div>
        )}
        <div className={quote ? 'md:col-span-1' : 'md:col-span-2'}>
          <Select
            label="Status"
            name="status"
            value={formData.status}
            onChange={handleChange}
            options={statusOptions}
          />
        </div>
        <Input
          label="Sales Order #"
          name="sales_order_number"
          value={formData.sales_order_number}
          onChange={handleChange}
          placeholder="SO-123456"
        />
        <Input
          label="Custom Rug SKU"
          name="custom_rug_sku"
          value={formData.custom_rug_sku}
          onChange={handleChange}
          placeholder="CRG-ABC123"
        />
      </div>

      {/* Customer Information */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Input
          label="Customer Name"
          name="customer_name"
          value={formData.customer_name}
          onChange={handleChange}
          required
          placeholder="John Smith"
        />
        <Input
          label="Customer Number"
          name="customer_number"
          value={formData.customer_number}
          onChange={handleChange}
          required
          placeholder="CUST001"
        />
        <Input
          label="Customer Company"
          name="customer_company"
          value={formData.customer_company}
          onChange={handleChange}
          required
          placeholder="Acme Interiors"
        />
      </div>

      {/* Product Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Product Name"
          name="product_name"
          value={formData.product_name}
          onChange={handleChange}
          placeholder="Custom Wool Rug 8x10"
        />
        <Input
          label="Image Render URL"
          name="image_render_url"
          value={formData.image_render_url}
          onChange={handleChange}
          placeholder="https://..."
          type="url"
        />
      </div>

      {/* URLs Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Documents URL"
          name="documents_url"
          value={formData.documents_url}
          onChange={handleChange}
          placeholder="https://..."
          type="url"
        />
        <div></div>
      </div>

      {/* CAD and Swatch Sections Side by Side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* CAD Section */}
        <div className="border border-jl-border rounded-md p-3 space-y-3">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="cad_requested"
              name="cad_requested"
              checked={formData.cad_requested}
              onChange={handleChange}
              className="h-4 w-4 rounded border-jl-border text-jl-charcoal focus:ring-jl-charcoal"
            />
            <label htmlFor="cad_requested" className="text-sm font-medium text-jl-charcoal">
              CAD Requested
            </label>
          </div>

          {formData.cad_requested && (
            <div className="space-y-3 pl-6">
              <Input
                label="CAD File URL"
                name="cad_file_url"
                value={formData.cad_file_url}
                onChange={handleChange}
                placeholder="https://..."
                type="url"
              />
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="cad_approved"
                  name="cad_approved"
                  checked={formData.cad_approved}
                  onChange={handleChange}
                  className="h-4 w-4 rounded border-jl-border text-jl-charcoal focus:ring-jl-charcoal"
                />
                <label htmlFor="cad_approved" className="text-sm font-medium text-jl-charcoal">
                  CAD Approved
                </label>
                {quote?.cad_approved_at && (
                  <span className="text-xs text-jl-muted">
                    ({new Date(quote.cad_approved_at).toLocaleDateString()})
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Swatch Approval Section */}
        <div className="border border-jl-border rounded-md p-3 space-y-3">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="swatch_approved"
              name="swatch_approved"
              checked={formData.swatch_approved}
              onChange={handleChange}
              className="h-4 w-4 rounded border-jl-border text-jl-charcoal focus:ring-jl-charcoal"
            />
            <label htmlFor="swatch_approved" className="text-sm font-medium text-jl-charcoal">
              Swatch Approved
            </label>
            {quote?.swatch_approved_at && (
              <span className="text-xs text-jl-muted">
                ({new Date(quote.swatch_approved_at).toLocaleDateString()})
              </span>
            )}
          </div>

          {formData.swatch_approved && (
            <div className="pl-6">
              <Input
                label="Approved By"
                name="swatch_approved_by"
                value={formData.swatch_approved_by}
                onChange={handleChange}
                placeholder={adminEmail || "Approver's name or email"}
              />
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-end pt-3 border-t border-jl-border">
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Saving...' : quote ? 'Update Quote' : 'Create Quote'}
          </Button>
        </div>
      </div>

      {/* Notes Section - At Bottom */}
      {quote && (
        <div className="border-t border-jl-border pt-4 mt-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-jl-charcoal">Activity Log</h3>
          </div>

          {/* Add Note */}
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              className="flex-1 px-3 py-1.5 border border-jl-border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-jl-charcoal focus:border-transparent"
              placeholder="Add a note..."
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleAddNote()
                }
              }}
            />
            <Button
              type="button"
              variant="outline"
              onClick={handleAddNote}
              disabled={addingNote || !newNote.trim()}
              className="text-sm px-3 py-1"
            >
              {addingNote ? 'Adding...' : 'Add'}
            </Button>
          </div>

          {/* Notes List - Compact */}
          {notes.length > 0 ? (
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {notes.map((note) => (
                <div key={note.id} className="text-xs text-jl-charcoal py-1 border-b border-gray-100 last:border-0">
                  <span className="text-jl-muted">{formatNoteDate(note.created_at)}</span>
                  <span className="mx-1.5 text-jl-muted">|</span>
                  <span className="font-medium">{note.created_by}</span>
                  <span className="mx-1.5 text-jl-muted">-</span>
                  <span>{note.content}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-jl-muted">No activity yet.</p>
          )}
        </div>
      )}

      {/* Delete Quote Section - Separated at bottom */}
      {quote && onDelete && (
        <div className="border-t border-red-200 pt-6 mt-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-red-600">Danger Zone</h3>
              <p className="text-xs text-jl-muted mt-1">This action cannot be undone.</p>
            </div>
            <Button
              type="button"
              variant="danger"
              onClick={handleDelete}
              disabled={loading}
            >
              Delete Quote
            </Button>
          </div>
        </div>
      )}
    </form>
  )
}
