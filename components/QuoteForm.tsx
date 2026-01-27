'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Quote } from '@/lib/types'
import { QUOTE_STATUSES, QuoteStatus } from '@/lib/constants'
import { Button, Input, Select } from '@/components/ui'

export interface QuoteFormData {
  customer_name: string
  customer_number: string
  customer_company: string
  cad_file_url: string | null
  image_render_url: string | null
  status: QuoteStatus
  sales_order_number: string | null
  custom_rug_sku: string | null
}

interface QuoteFormProps {
  quote?: Quote
  onSubmit: (data: QuoteFormData) => Promise<void>
  onDelete?: () => Promise<void>
}

export function QuoteForm({ quote, onSubmit, onDelete }: QuoteFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    customer_name: quote?.customer_name || '',
    customer_number: quote?.customer_number || '',
    customer_company: quote?.customer_company || '',
    cad_file_url: quote?.cad_file_url || '',
    image_render_url: quote?.image_render_url || '',
    status: quote?.status || 'Inquiry' as QuoteStatus,
    sales_order_number: quote?.sales_order_number || '',
    custom_rug_sku: quote?.custom_rug_sku || '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const data: QuoteFormData = {
        customer_name: formData.customer_name,
        customer_number: formData.customer_number,
        customer_company: formData.customer_company,
        cad_file_url: formData.cad_file_url || null,
        image_render_url: formData.image_render_url || null,
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

  const statusOptions = QUOTE_STATUSES.map((status) => ({
    value: status,
    label: status,
  }))

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm">
          {error}
        </div>
      )}

      {quote && (
        <div className="p-4 bg-jl-offwhite rounded-md">
          <p className="text-sm text-jl-muted">Quote Number</p>
          <p className="text-lg font-medium text-jl-charcoal">{quote.quote_number}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

        <Select
          label="Status"
          name="status"
          value={formData.status}
          onChange={handleChange}
          options={statusOptions}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="CAD File URL"
          name="cad_file_url"
          value={formData.cad_file_url}
          onChange={handleChange}
          placeholder="https://..."
          type="url"
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Sales Order Number"
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

      <div className="flex items-center justify-between pt-4 border-t border-jl-border">
        <div>
          {quote && onDelete && (
            <Button
              type="button"
              variant="danger"
              onClick={handleDelete}
              disabled={loading}
            >
              Delete Quote
            </Button>
          )}
        </div>

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
    </form>
  )
}
