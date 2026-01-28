'use client'

import React from 'react'
import Image from 'next/image'
import { Quote } from '@/lib/types'
import { StatusBadge } from '@/components/StatusBadge'
import { QUOTE_STATUSES } from '@/lib/constants'

interface CustomerQuotesTableProps {
  quotes: Quote[]
}

interface ProgressBarProps {
  currentStatus: string
}

function ProgressBar({ currentStatus }: ProgressBarProps) {
  const currentIndex = QUOTE_STATUSES.indexOf(currentStatus as typeof QUOTE_STATUSES[number])
  const totalSteps = QUOTE_STATUSES.length
  const progressPercent = (currentIndex / (totalSteps - 1)) * 100

  const firstStatus = QUOTE_STATUSES[0]
  const lastStatus = QUOTE_STATUSES[totalSteps - 1]

  return (
    <div className="w-[80%] mx-auto py-4">
      {/* Labels row */}
      <div className="relative flex justify-between mb-2">
        <span className="text-[10px] text-[#393939]">{firstStatus}</span>
        <span
          className="text-[10px] text-[#393939] font-semibold absolute"
          style={{ left: `${progressPercent}%`, transform: 'translateX(-50%)' }}
        >
          {currentStatus}
        </span>
        <span className="text-[10px] text-[#393939]">{lastStatus}</span>
      </div>

      {/* Slider track */}
      <div className="relative h-2 bg-gray-300 rounded-full">
        {/* Filled portion */}
        <div
          className="absolute left-0 top-0 h-full bg-[#393939] rounded-full"
          style={{ width: `${progressPercent}%` }}
        />
        {/* Current position indicator */}
        <div
          className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-[#393939] rounded-full border-2 border-white shadow"
          style={{ left: `${progressPercent}%`, transform: 'translate(-50%, -50%)' }}
        />
      </div>
    </div>
  )
}

export function CustomerQuotesTable({ quotes }: CustomerQuotesTableProps) {
  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-[#393939]">
            <th className="px-4 py-3 text-left text-sm font-normal text-[#393939]">Image</th>
            <th className="px-4 py-3 text-left text-sm font-normal text-[#393939]">Quote #</th>
            <th className="px-4 py-3 text-left text-sm font-normal text-[#393939]">Status</th>
            <th className="px-4 py-3 text-left text-sm font-normal text-[#393939]">SKU</th>
            <th className="px-4 py-3 text-left text-sm font-normal text-[#393939]">Sales Order</th>
            <th className="px-4 py-3 text-left text-sm font-normal text-[#393939]">CAD</th>
            <th className="px-4 py-3 text-left text-sm font-normal text-[#393939]">Date</th>
          </tr>
        </thead>
        <tbody>
          {quotes.map((quote) => (
            <React.Fragment key={quote.id}>
              <tr>
                <td className="px-4 py-3 text-sm text-[#393939]">
                  {quote.image_render_url ? (
                    <div className="relative w-20 h-20 overflow-hidden border border-[#393939]">
                      <Image
                        src={quote.image_render_url}
                        alt={`Render for ${quote.quote_number}`}
                        fill
                        className="object-cover"
                        sizes="80px"
                      />
                    </div>
                  ) : (
                    <div className="w-20 h-20 border border-[#393939] flex items-center justify-center text-gray-500 text-xs">
                      No image
                    </div>
                  )}
                </td>
                <td className="px-4 py-3 text-sm font-medium text-[#393939]">
                  {quote.quote_number}
                </td>
                <td className="px-4 py-3 text-sm text-[#393939]">
                  <StatusBadge status={quote.status} />
                </td>
                <td className="px-4 py-3 text-sm text-[#393939]">
                  {quote.custom_rug_sku || 'TBD'}
                </td>
                <td className="px-4 py-3 text-sm text-[#393939]">
                  {quote.sales_order_number || 'Pending'}
                </td>
                <td className="px-4 py-3 text-sm">
                  {quote.cad_file_url ? (
                    <a
                      href={quote.cad_file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      View CAD
                    </a>
                  ) : (
                    <span className="text-gray-500">-</span>
                  )}
                </td>
                <td className="px-4 py-3 text-sm text-[#393939]">
                  {new Date(quote.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </td>
              </tr>
              <tr className="border-b border-[#393939]">
                <td colSpan={7} className="pb-2">
                  <ProgressBar currentStatus={quote.status} />
                </td>
              </tr>
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  )
}
