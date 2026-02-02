'use client'

import { useState } from 'react'
import { Quote } from '@/lib/types'

type ApprovalType = 'cad' | 'swatch'

interface ApprovalModalProps {
  quote: Quote
  type: ApprovalType
  isOpen: boolean
  onClose: () => void
  onApprove: () => Promise<void>
}

export function ApprovalModal({ quote, type, isOpen, onClose, onApprove }: ApprovalModalProps) {
  const [agreed, setAgreed] = useState(false)
  const [agreedDeposit, setAgreedDeposit] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  const isCAD = type === 'cad'
  const typeLabel = isCAD ? 'CAD' : 'Swatch'
  const typeLabelLower = isCAD ? 'CAD' : 'swatch'

  const handleApprove = async () => {
    if (!agreed || (type === 'swatch' && !agreedDeposit)) return

    setIsSubmitting(true)
    setError(null)

    try {
      await onApprove()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setAgreed(false)
    setAgreedDeposit(false)
    setError(null)
    onClose()
  }

  const canApprove = agreed && (type === 'cad' || agreedDeposit)

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white max-w-xl w-full mx-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#393939]">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[#393939] uppercase tracking-wide">
              {isCAD ? 'CAD File Approval' : 'Swatch Approval'}
            </h2>
            <button
              onClick={handleClose}
              className="text-[#393939] hover:text-black"
              aria-label="Close"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-6 overflow-y-auto flex-1">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Quote Info */}
          <div className="mb-6 pb-4 border-b border-gray-200">
            <p className="text-sm text-[#393939]">
              <span className="font-medium">Quote:</span> {quote.quote_number}
            </p>
            {quote.product_name && (
              <p className="text-sm text-[#393939]">
                <span className="font-medium">Product:</span> {quote.product_name}
              </p>
            )}
          </div>

          {/* Disclaimer Text */}
          <div className="mb-6">
            <p className="text-sm text-[#393939] leading-relaxed">
              By approving this {typeLabelLower} you are agreeing that you have reviewed the {typeLabelLower} and are approving Jaipur Living to move forward to the next step in creating your custom rug.
            </p>
            <p className="text-sm text-[#393939] leading-relaxed mt-3">
              If there are any issues or changes needed in the design{type === 'swatch' ? ' or construction' : ''}, please contact your Jaipur Living custom rug expert and we will make the needed changes and resubmit.
            </p>
          </div>

          {/* Primary Checkbox */}
          <div className="mb-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-1 h-4 w-4 border-[#393939] text-[#393939] focus:ring-[#393939]"
              />
              <span className="text-sm text-[#393939] leading-relaxed">
                I have read and understand the {typeLabel} approval terms above and agree that the {typeLabel} is approved and ready to move to the next stage of production.
              </span>
            </label>
          </div>

          {/* Swatch-specific Deposit Checkbox */}
          {type === 'swatch' && (
            <div className="mb-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreedDeposit}
                  onChange={(e) => setAgreedDeposit(e.target.checked)}
                  className="mt-1 h-4 w-4 border-[#393939] text-[#393939] focus:ring-[#393939]"
                />
                <span className="text-sm text-[#393939] leading-relaxed">
                  I understand that by approving this swatch, I am agreeing to move forward with my custom rug purchase, and that a 50% deposit will be paid using the payment method on file. Any changes must be made within 5 business days to avoid any issues and forfeiting the deposit.
                </span>
              </label>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#393939] flex justify-end gap-3">
          <button
            onClick={handleClose}
            className="px-6 py-2 text-sm font-medium text-[#393939] border border-[#393939] hover:bg-gray-100 uppercase tracking-wide"
          >
            Cancel
          </button>
          <button
            onClick={handleApprove}
            disabled={!canApprove || isSubmitting}
            className={`px-6 py-2 text-sm font-medium uppercase tracking-wide ${
              canApprove && !isSubmitting
                ? 'bg-[#393939] text-white hover:bg-black'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {isSubmitting ? 'Approving...' : `Approve ${typeLabel}`}
          </button>
        </div>
      </div>
    </div>
  )
}
