'use client'

import { QuoteStatus } from '@/lib/constants'

interface StatusBadgeProps {
  status: QuoteStatus
  className?: string
}

export function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  return (
    <span className={`text-sm text-jl-charcoal ${className}`}>
      {status}
    </span>
  )
}
