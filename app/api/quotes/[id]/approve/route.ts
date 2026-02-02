import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

interface RouteParams {
  params: Promise<{ id: string }>
}

// POST /api/quotes/[id]/approve - Approve CAD or Swatch for a quote
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const supabase = await createServiceClient()

    const body = await request.json()
    const { type, approved_by } = body

    if (!type || !['cad', 'swatch'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid approval type. Must be "cad" or "swatch".' },
        { status: 400 }
      )
    }

    // Fetch the current quote to verify it exists and check current status
    const { data: quote, error: fetchError } = await supabase
      .from('quotes')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !quote) {
      return NextResponse.json({ error: 'Quote not found' }, { status: 404 })
    }

    // Prepare update based on approval type
    let updateData: Record<string, unknown> = {}
    let noteContent = ''
    const approverName = approved_by || 'Customer'

    if (type === 'cad') {
      // Verify quote is in CAD Approval Pending status
      if (quote.status !== 'CAD Approval Pending') {
        return NextResponse.json(
          { error: 'Quote is not pending CAD approval' },
          { status: 400 }
        )
      }
      updateData = {
        cad_approved: true,
        // The trigger will set cad_approved_at and update status to 'CAD Approved'
      }
      noteContent = `Status changed to CAD Approved by ${approverName}`
    } else if (type === 'swatch') {
      // Verify quote is in Swatch Approval Pending status
      if (quote.status !== 'Swatch Approval Pending') {
        return NextResponse.json(
          { error: 'Quote is not pending swatch approval' },
          { status: 400 }
        )
      }
      updateData = {
        swatch_approved: true,
        swatch_approved_by: approverName,
        // The trigger will set swatch_approved_at and update status to 'Swatch Approved'
      }
      noteContent = `Status changed to Swatch Approved by ${approverName}`
    }

    // Update the quote
    const { data, error } = await supabase
      .from('quotes')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Add a note to track the status change
    await supabase
      .from('quote_notes')
      .insert({
        quote_id: id,
        content: noteContent,
        created_by: approverName,
      })

    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
