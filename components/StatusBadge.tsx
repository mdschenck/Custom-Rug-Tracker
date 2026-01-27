'use client'

import { QuoteStatus, STATUS_COLORS } from '@/lib/constants'

interface StatusBadgeProps {
  status: QuoteStatus
  className?: string
}

export function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  const colors = STATUS_COLORS[status] || { bg: 'bg-gray-100', text: 'text-gray-700' }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors.bg} ${colors.text} ${className}`}
    >
      {status}
    </span>
  )
}
