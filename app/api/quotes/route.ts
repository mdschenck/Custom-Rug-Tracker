import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { QuoteInsert } from '@/lib/types'

// GET /api/quotes - List all quotes or filter by customer_number
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)

    const customerNumber = searchParams.get('customer_number')
    const status = searchParams.get('status')
    const search = searchParams.get('search')

    let query = supabase
      .from('quotes')
      .select('*')
      .order('created_at', { ascending: false })

    if (customerNumber) {
      query = query.eq('customer_number', customerNumber)
    }

    if (status) {
      query = query.eq('status', status)
    }

    if (search) {
      query = query.or(`customer_name.ilike.%${search}%,customer_number.ilike.%${search}%,quote_number.ilike.%${search}%`)
    }

    const { data, error } = await query

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

// POST /api/quotes - Create a new quote
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServiceClient()

    // Check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: QuoteInsert = await request.json()

    // Validate required fields
    if (!body.customer_name || !body.customer_number || !body.customer_company) {
      return NextResponse.json(
        { error: 'Missing required fields: customer_name, customer_number, customer_company' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('quotes')
      .insert(body)
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
