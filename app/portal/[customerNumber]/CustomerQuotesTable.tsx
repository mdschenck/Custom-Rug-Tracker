'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Quote } from '@/lib/types'
import { StatusBadge } from '@/components/StatusBadge'
import { QUOTE_STATUSES } from '@/lib/constants'
import { ApprovalModal } from '@/components/ApprovalModal'

interface CustomerQuotesTableProps {
  quotes: Quote[]
  customerName?: string
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

  const isAwaitingApproval = currentStatus === 'CAD Approval Pending' || currentStatus === 'Swatch Approval Pending'

  return (
    <div className="w-[80%] mx-auto py-4">
      {/* Labels row */}
      <div className="relative flex justify-between mb-2">
        <span className="text-[10px] text-[#393939]">{firstStatus}</span>
        <span
          className={`text-[10px] font-semibold absolute ${isAwaitingApproval ? 'text-[#d73a49]' : 'text-[#393939]'}`}
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

interface ApprovalAlertProps {
  quote: Quote
  onReviewClick: () => void
}

function ApprovalAlert({ quote, onReviewClick }: ApprovalAlertProps) {
  const isCAD = quote.status === 'CAD Approval Pending'
  const typeLabel = isCAD ? 'CAD' : 'Swatch'

  return (
    <div className="mx-4 my-3 p-4 border border-[#d73a49] bg-red-50">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <p className="text-[#d73a49] font-semibold text-sm uppercase tracking-wide">
          Action Needed: {typeLabel} Awaiting Approval
        </p>
        <button
          onClick={onReviewClick}
          className="bg-[#393939] text-white text-sm font-medium px-4 py-2 uppercase tracking-wide hover:bg-black"
        >
          Review and Approve {typeLabel}
        </button>
      </div>
    </div>
  )
}

export function CustomerQuotesTable({ quotes, customerName }: CustomerQuotesTableProps) {
  const router = useRouter()
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null)
  const [approvalType, setApprovalType] = useState<'cad' | 'swatch'>('cad')
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleReviewClick = (quote: Quote) => {
    const type = quote.status === 'CAD Approval Pending' ? 'cad' : 'swatch'
    setSelectedQuote(quote)
    setApprovalType(type)
    setIsModalOpen(true)
  }

  const handleApprove = async () => {
    if (!selectedQuote) return

    const response = await fetch(`/api/quotes/${selectedQuote.id}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: approvalType,
        approved_by: customerName || 'Customer',
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Failed to approve')
    }

    // Refresh the page to show updated status
    router.refresh()
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedQuote(null)
  }

  const needsApproval = (status: string) => {
    return status === 'CAD Approval Pending' || status === 'Swatch Approval Pending'
  }

  return (
    <>
      <div className="w-full overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-[#393939]">
              <th className="px-4 py-3 text-left text-sm font-normal text-[#393939]">Image</th>
              <th className="px-4 py-3 text-left text-sm font-normal text-[#393939]">Product Name</th>
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
                {/* Data Row */}
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
                  <td className="px-4 py-3 text-sm text-[#393939]">
                    {quote.product_name || '-'}
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

                {/* Approval Alert Row (if needed) */}
                {needsApproval(quote.status) && (
                  <tr>
                    <td colSpan={8} className="p-0">
                      <ApprovalAlert quote={quote} onReviewClick={() => handleReviewClick(quote)} />
                    </td>
                  </tr>
                )}

                {/* Progress Bar Row */}
                <tr className="border-b border-[#393939]">
                  <td colSpan={8} className="pb-2">
                    <ProgressBar currentStatus={quote.status} />
                  </td>
                </tr>
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {/* Approval Modal */}
      {selectedQuote && (
        <ApprovalModal
          quote={selectedQuote}
          type={approvalType}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onApprove={handleApprove}
        />
      )}
    </>
  )
}
