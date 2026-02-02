import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { QuoteUpdate, ActivityLogInsert } from '@/lib/types'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/quotes/[id] - Get a single quote
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('quotes')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Quote not found' }, { status: 404 })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH /api/quotes/[id] - Update a quote
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const supabase = await createServiceClient()

    // Check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get the current quote to detect status changes
    const { data: currentQuote } = await supabase
      .from('quotes')
      .select('status, quote_number')
      .eq('id', id)
      .single()

    const body: QuoteUpdate = await request.json()

    const { data, error } = await supabase
      .from('quotes')
      .update(body)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Quote not found' }, { status: 404 })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Log the activity
    const performedBy = user.email || 'Admin'

    // Check if status changed
    if (body.status && currentQuote && body.status !== currentQuote.status) {
      const statusLog: ActivityLogInsert = {
        action_type: 'status_changed',
        quote_id: id,
        quote_number: data.quote_number,
        performed_by: performedBy,
        details: `Status changed from "${currentQuote.status}" to "${body.status}"`,
      }
      await supabase.from('activity_logs').insert(statusLog)
    } else {
      // General update
      const updateLog: ActivityLogInsert = {
        action_type: 'quote_updated',
        quote_id: id,
        quote_number: data.quote_number,
        performed_by: performedBy,
        details: `Updated quote ${data.quote_number}`,
      }
      await supabase.from('activity_logs').insert(updateLog)
    }

    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/quotes/[id] - Delete a quote
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const supabase = await createServiceClient()

    // Check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get the quote info before deleting for logging
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
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Log the deletion
    const deleteLog: ActivityLogInsert = {
      action_type: 'quote_deleted',
      quote_id: null, // Quote no longer exists
      quote_number: quote?.quote_number || null,
      performed_by: user.email || 'Admin',
      details: quote ? `Deleted quote ${quote.quote_number} for ${quote.customer_name}` : 'Deleted quote',
    }
    await supabase.from('activity_logs').insert(deleteLog)

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
