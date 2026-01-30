import { createClient } from '@/lib/supabase/server'
import { Quote } from '@/lib/types'
import { CustomerQuotesTable } from './CustomerQuotesTable'

interface PageProps {
  params: Promise<{ customerNumber: string }>
}

export default async function CustomerQuotesPage({ params }: PageProps) {
  const { customerNumber } = await params
  const decodedCustomerNumber = decodeURIComponent(customerNumber)
  const supabase = await createClient()

  const { data: quotes, error } = await supabase
    .from('quotes')
    .select('*')
    .eq('customer_number', decodedCustomerNumber)
    .order('created_at', { ascending: false })

  if (error) {
    return (
      <div className="p-8">
        <div className="text-red-600">Error loading quotes. Please try again.</div>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-8 bg-white min-h-screen">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="font-thin text-[#393939]" style={{ fontSize: '22px', fontWeight: 100 }}>
            My Custom Rug Quotes
          </h1>
        </div>

        {quotes && quotes.length > 0 ? (
          <CustomerQuotesTable quotes={quotes as Quote[]} />
        ) : (
          <div className="p-12 text-center">
            <p className="text-gray-600">
              No quotes found for customer number: {decodedCustomerNumber}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
