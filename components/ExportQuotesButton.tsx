'use client'

import { useState, useRef, useEffect } from 'react'
import { Quote } from '@/lib/types'
import { Button } from '@/components/ui'

interface ExportQuotesButtonProps {
  filteredQuotes: Quote[]
  hasFilters: boolean
}

export function ExportQuotesButton({ filteredQuotes, hasFilters }: ExportQuotesButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const generateCSV = (quotes: Quote[]): string => {
    const headers = [
      'quote_number',
      'customer_name',
      'customer_number',
      'customer_company',
      'product_name',
      'status',
      'sales_order_number',
      'custom_rug_sku',
      'cad_file_url',
      'image_render_url',
      'cad_requested',
      'cad_approved',
      'swatch_approved',
      'swatch_approved_by',
      'created_at',
      'updated_at',
    ]

    const escapeCSV = (value: string | null | undefined): string => {
      if (value === null || value === undefined) return ''
      const str = String(value)
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`
      }
      return str
    }

    const rows = quotes.map((quote) =>
      headers.map((header) => escapeCSV(quote[header as keyof Quote] as string)).join(',')
    )

    return [headers.join(','), ...rows].join('\n')
  }

  const downloadCSV = (csv: string, filename: string) => {
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const getFilename = (): string => {
    const date = new Date().toISOString().split('T')[0]
    return `quotes-export-${date}.csv`
  }

  const handleExportAll = async () => {
    setIsExporting(true)
    setIsOpen(false)
    try {
      const response = await fetch('/api/quotes')
      if (!response.ok) throw new Error('Failed to fetch quotes')
      const allQuotes: Quote[] = await response.json()
      const csv = generateCSV(allQuotes)
      downloadCSV(csv, getFilename())
    } catch (error) {
      console.error('Export failed:', error)
      alert('Failed to export quotes. Please try again.')
    } finally {
      setIsExporting(false)
    }
  }

  const handleExportFiltered = () => {
    setIsOpen(false)
    const csv = generateCSV(filteredQuotes)
    downloadCSV(csv, getFilename())
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        disabled={isExporting}
      >
        {isExporting ? 'Exporting...' : 'Export'}
        <svg
          className="ml-2 h-4 w-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </Button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 z-10">
          <div className="py-1">
            <button
              onClick={handleExportAll}
              className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
            >
              Export All Quotes
            </button>
            <button
              onClick={handleExportFiltered}
              className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
              disabled={!hasFilters && filteredQuotes.length === 0}
            >
              Export Filtered Results
              {hasFilters && (
                <span className="ml-2 text-gray-500">({filteredQuotes.length})</span>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
