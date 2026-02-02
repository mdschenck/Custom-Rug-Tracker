'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Quote } from '@/lib/types'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui'
import { StatusBadge } from './StatusBadge'

interface QuotesTableProps {
  quotes: Quote[]
  isAdmin?: boolean
}

export function QuotesTable({ quotes, isAdmin = false }: QuotesTableProps) {
  if (quotes.length === 0) {
    return (
      <div className="text-center py-12 text-jl-muted">
        No quotes found.
      </div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Image</TableHead>
          <TableHead>Product Name</TableHead>
          <TableHead>Quote #</TableHead>
          <TableHead>Customer</TableHead>
          <TableHead>Company</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>SKU</TableHead>
          <TableHead>Sales Order</TableHead>
          {isAdmin && <TableHead>Actions</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {quotes.map((quote) => (
          <TableRow key={quote.id}>
            <TableCell>
              {quote.image_render_url ? (
                <div className="relative w-16 h-16 rounded overflow-hidden bg-jl-offwhite">
                  <Image
                    src={quote.image_render_url}
                    alt={`Render for ${quote.quote_number}`}
                    fill
                    className="object-cover"
                    sizes="64px"
                  />
                </div>
              ) : (
                <div className="w-16 h-16 rounded bg-jl-offwhite flex items-center justify-center text-jl-muted text-xs">
                  No image
                </div>
              )}
            </TableCell>
            <TableCell>{quote.product_name || '-'}</TableCell>
            <TableCell className="font-medium">
              {isAdmin ? (
                <Link
                  href={`/admin/quotes/${quote.id}`}
                  className="text-jl-charcoal hover:underline"
                >
                  {quote.quote_number}
                </Link>
              ) : (
                quote.quote_number
              )}
            </TableCell>
            <TableCell>
              <div>{quote.customer_name}</div>
              <div className="text-xs text-jl-muted">#{quote.customer_number}</div>
            </TableCell>
            <TableCell>{quote.customer_company}</TableCell>
            <TableCell>
              <StatusBadge status={quote.status} />
            </TableCell>
            <TableCell>{quote.custom_rug_sku || '-'}</TableCell>
            <TableCell>{quote.sales_order_number || '-'}</TableCell>
            {isAdmin && (
              <TableCell>
                <div className="flex items-center gap-2">
                  {quote.cad_file_url && (
                    <a
                      href={quote.cad_file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline"
                    >
                      CAD
                    </a>
                  )}
                  <Link
                    href={`/admin/quotes/${quote.id}`}
                    className="text-sm text-jl-charcoal hover:underline"
                  >
                    Edit
                  </Link>
                </div>
              </TableCell>
            )}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
