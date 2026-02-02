'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect } from 'react'

const ACTION_TYPES = [
  { value: 'all', label: 'All Actions' },
  { value: 'quote_created', label: 'Quote Created' },
  { value: 'quote_updated', label: 'Quote Updated' },
  { value: 'quote_deleted', label: 'Quote Deleted' },
  { value: 'status_changed', label: 'Status Changed' },
  { value: 'cad_approved', label: 'CAD Approved' },
  { value: 'swatch_approved', label: 'Swatch Approved' },
]

interface ActivityLogFilterProps {
  currentActionType: string
  currentStartDate: string
  currentEndDate: string
}

export function ActivityLogFilter({
  currentActionType,
  currentStartDate,
  currentEndDate,
}: ActivityLogFilterProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [actionType, setActionType] = useState(currentActionType)
  const [startDate, setStartDate] = useState(currentStartDate)
  const [endDate, setEndDate] = useState(currentEndDate)

  useEffect(() => {
    setActionType(currentActionType)
    setStartDate(currentStartDate)
    setEndDate(currentEndDate)
  }, [currentActionType, currentStartDate, currentEndDate])

  const updateFilters = (newParams: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString())

    Object.entries(newParams).forEach(([key, value]) => {
      if (value && value !== 'all' && value !== '') {
        params.set(key, value)
      } else {
        params.delete(key)
      }
    })

    router.push(`/admin/activity-log?${params.toString()}`)
  }

  const handleActionTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value
    setActionType(value)
    updateFilters({ action_type: value, start_date: startDate, end_date: endDate })
  }

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setStartDate(value)
    updateFilters({ action_type: actionType, start_date: value, end_date: endDate })
  }

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setEndDate(value)
    updateFilters({ action_type: actionType, start_date: startDate, end_date: value })
  }

  const handleClearFilters = () => {
    setActionType('all')
    setStartDate('')
    setEndDate('')
    router.push('/admin/activity-log')
  }

  const hasFilters = actionType !== 'all' || startDate || endDate

  return (
    <div className="flex flex-wrap items-center gap-4">
      <div className="flex items-center gap-2">
        <label htmlFor="action_type" className="text-sm font-medium text-gray-700">
          Action Type:
        </label>
        <select
          id="action_type"
          value={actionType}
          onChange={handleActionTypeChange}
          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-jl-gold focus:outline-none focus:ring-1 focus:ring-jl-gold"
        >
          {ACTION_TYPES.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-2">
        <label htmlFor="start_date" className="text-sm font-medium text-gray-700">
          From:
        </label>
        <input
          type="date"
          id="start_date"
          value={startDate}
          onChange={handleStartDateChange}
          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-jl-gold focus:outline-none focus:ring-1 focus:ring-jl-gold"
        />
      </div>

      <div className="flex items-center gap-2">
        <label htmlFor="end_date" className="text-sm font-medium text-gray-700">
          To:
        </label>
        <input
          type="date"
          id="end_date"
          value={endDate}
          onChange={handleEndDateChange}
          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-jl-gold focus:outline-none focus:ring-1 focus:ring-jl-gold"
        />
      </div>

      {hasFilters && (
        <button
          onClick={handleClearFilters}
          className="text-sm text-gray-500 hover:text-gray-700 underline"
        >
          Clear Filters
        </button>
      )}
    </div>
  )
}
