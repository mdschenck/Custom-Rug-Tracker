import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/quotes/[id]/notes - Get all notes for a quote
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('quote_notes')
      .select('*')
      .eq('quote_id', id)
      .order('created_at', { ascending: false })

    if (error) {
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

// POST /api/quotes/[id]/notes - Add a note to a quote
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const supabase = await createServiceClient()

    // Check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    if (!body.content || typeof body.content !== 'string' || !body.content.trim()) {
      return NextResponse.json(
        { error: 'Note content is required' },
        { status: 400 }
      )
    }

    // Verify the quote exists
    const { data: quote, error: quoteError } = await supabase
      .from('quotes')
      .select('id')
      .eq('id', id)
      .single()

    if (quoteError || !quote) {
      return NextResponse.json({ error: 'Quote not found' }, { status: 404 })
    }

    // Insert the note
    const { data, error } = await supabase
      .from('quote_notes')
      .insert({
        quote_id: id,
        content: body.content.trim(),
        created_by: user.email || 'Unknown Admin',
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
