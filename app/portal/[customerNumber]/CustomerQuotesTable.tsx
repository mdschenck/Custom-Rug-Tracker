'use client'

import Image from 'next/image'
import { Quote } from '@/lib/types'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui'
import { StatusBadge } from '@/components/StatusBadge'

interface CustomerQuotesTableProps {
  quotes: Quote[]
}

export function CustomerQuotesTable({ quotes }: CustomerQuotesTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow className="bg-jl-offwhite">
          <TableHead>Image</TableHead>
          <TableHead>Quote #</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>SKU</TableHead>
          <TableHead>Sales Order</TableHead>
          <TableHead>CAD</TableHead>
          <TableHead>Date</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {quotes.map((quote) => (
          <TableRow key={quote.id}>
            <TableCell>
              {quote.image_render_url ? (
                <div className="relative w-20 h-20 rounded overflow-hidden bg-jl-offwhite border border-jl-border">
                  <Image
                    src={quote.image_render_url}
                    alt={`Render for ${quote.quote_number}`}
                    fill
                    className="object-cover"
                    sizes="80px"
                  />
                </div>
              ) : (
                <div className="w-20 h-20 rounded bg-jl-offwhite border border-jl-border flex items-center justify-center text-jl-muted text-xs">
                  No image
                </div>
              )}
            </TableCell>
            <TableCell className="font-medium text-jl-charcoal">
              {quote.quote_number}
            </TableCell>
            <TableCell>
              <StatusBadge status={quote.status} />
            </TableCell>
            <TableCell className="text-jl-secondary">
              {quote.custom_rug_sku || '-'}
            </TableCell>
            <TableCell className="text-jl-secondary">
              {quote.sales_order_number || '-'}
            </TableCell>
            <TableCell>
              {quote.cad_file_url ? (
                <a
                  href={quote.cad_file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline text-sm"
                >
                  View CAD
                </a>
              ) : (
                <span className="text-jl-muted text-sm">-</span>
              )}
            </TableCell>
            <TableCell className="text-jl-muted text-sm">
              {new Date(quote.created_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
