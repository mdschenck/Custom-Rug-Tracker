import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { QuoteInsert, ActivityLogInsert } from '@/lib/types'
import { QUOTE_STATUSES, QuoteStatus } from '@/lib/constants'

interface ImportRow {
  customer_name: string
  customer_number: string
  customer_company: string
  status?: string
  sales_order_number?: string
  custom_rug_sku?: string
  cad_file_url?: string
  image_render_url?: string
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const rows: ImportRow[] = await request.json()

    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json(
        { error: 'Request body must be a non-empty array of quote data' },
        { status: 400 }
      )
    }

    const validationErrors: string[] = []
    const validRows: QuoteInsert[] = []

    rows.forEach((row, index) => {
      const rowNum = index + 1

      // Validate required fields
      if (!row.customer_name || typeof row.customer_name !== 'string') {
        validationErrors.push(`Row ${rowNum}: customer_name is required`)
        return
      }
      if (!row.customer_number || typeof row.customer_number !== 'string') {
        validationErrors.push(`Row ${rowNum}: customer_number is required`)
        return
      }
      if (!row.customer_company || typeof row.customer_company !== 'string') {
        validationErrors.push(`Row ${rowNum}: customer_company is required`)
        return
      }

      // Validate status if provided
      if (row.status && !QUOTE_STATUSES.includes(row.status as QuoteStatus)) {
        validationErrors.push(
          `Row ${rowNum}: Invalid status "${row.status}". Valid values: ${QUOTE_STATUSES.join(', ')}`
        )
        return
      }

      validRows.push({
        customer_name: row.customer_name.trim(),
        customer_number: row.customer_number.trim(),
        customer_company: row.customer_company.trim(),
        status: (row.status as QuoteStatus) || 'Inquiry',
        sales_order_number: row.sales_order_number?.trim() || null,
        custom_rug_sku: row.custom_rug_sku?.trim() || null,
        cad_file_url: row.cad_file_url?.trim() || null,
        image_render_url: row.image_render_url?.trim() || null,
      })
    })

    if (validRows.length === 0) {
      return NextResponse.json(
        { error: 'No valid rows to import', errors: validationErrors },
        { status: 400 }
      )
    }

    // Use service client for insert to trigger quote_number generation
    const serviceSupabase = await createServiceClient()

    const { data, error } = await serviceSupabase
      .from('quotes')
      .insert(validRows)
      .select()

    if (error) {
      return NextResponse.json(
        { error: `Database error: ${error.message}` },
        { status: 500 }
      )
    }

    // Log the bulk import activity
    const activityLogs: ActivityLogInsert[] = data.map((quote) => ({
      action_type: 'quote_created' as const,
      quote_id: quote.id,
      quote_number: quote.quote_number,
      performed_by: user.email || 'Admin',
      details: `Imported via CSV: ${quote.customer_name} (${quote.customer_company})`,
    }))
    await serviceSupabase.from('activity_logs').insert(activityLogs)

    return NextResponse.json({
      imported: data.length,
      errors: validationErrors.length > 0 ? validationErrors : undefined,
    })
  } catch (error) {
    console.error('Import error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
