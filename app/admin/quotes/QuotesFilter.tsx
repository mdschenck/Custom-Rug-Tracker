'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useCallback } from 'react'
import { Input, Select } from '@/components/ui'

interface QuotesFilterProps {
  statusOptions: { value: string; label: string }[]
  currentStatus: string
  currentSearch: string
}

export function QuotesFilter({
  statusOptions,
  currentStatus,
  currentSearch,
}: QuotesFilterProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [search, setSearch] = useState(currentSearch)

  const updateParams = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value && value !== 'all') {
        params.set(key, value)
      } else {
        params.delete(key)
      }
      router.push(`/admin/quotes?${params.toString()}`)
    },
    [router, searchParams]
  )

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateParams('status', e.target.value)
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    updateParams('search', search)
  }

  return (
    <div className="flex flex-col sm:flex-row gap-4">
      <div className="w-full sm:w-48">
        <Select
          options={statusOptions}
          value={currentStatus}
          onChange={handleStatusChange}
        />
      </div>

      <form onSubmit={handleSearchSubmit} className="flex-1 flex gap-2">
        <div className="flex-1">
          <Input
            placeholder="Search by customer name, customer #, or quote #..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button
          type="submit"
          className="px-4 py-2 bg-jl-charcoal text-white rounded-md hover:bg-jl-dark transition-colors text-sm font-medium"
        >
          Search
        </button>
      </form>
    </div>
  )
}
