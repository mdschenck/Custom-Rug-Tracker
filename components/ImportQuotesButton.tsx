'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui'
import { QUOTE_STATUSES, QuoteStatus } from '@/lib/constants'

interface ParsedRow {
  customer_name: string
  customer_number: string
  customer_company: string
  product_name?: string
  documents_url?: string
  status?: string
  sales_order_number?: string
  custom_rug_sku?: string
  cad_file_url?: string
  image_render_url?: string
  cad_requested?: boolean
  cad_approved?: boolean
  swatch_approved?: boolean
  swatch_approved_by?: string
}

interface ValidationError {
  row: number
  field: string
  message: string
}

export function ImportQuotesButton() {
  const [isOpen, setIsOpen] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([])
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([])
  const [importResult, setImportResult] = useState<{ success: number; errors: string[] } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const parseCSV = (text: string): { headers: string[]; rows: string[][] } => {
    const lines = text.split(/\r?\n/).filter((line) => line.trim())
    if (lines.length === 0) return { headers: [], rows: [] }

    const parseRow = (line: string): string[] => {
      const result: string[] = []
      let current = ''
      let inQuotes = false

      for (let i = 0; i < line.length; i++) {
        const char = line[i]
        if (char === '"') {
          if (inQuotes && line[i + 1] === '"') {
            current += '"'
            i++
          } else {
            inQuotes = !inQuotes
          }
        } else if (char === ',' && !inQuotes) {
          result.push(current.trim())
          current = ''
        } else {
          current += char
        }
      }
      result.push(current.trim())
      return result
    }

    const headers = parseRow(lines[0])
    const rows = lines.slice(1).map(parseRow)

    return { headers, rows }
  }

  const validateAndParse = (headers: string[], rows: string[][]): { parsed: ParsedRow[]; errors: ValidationError[] } => {
    const errors: ValidationError[] = []
    const parsed: ParsedRow[] = []

    const requiredFields = ['customer_name', 'customer_number', 'customer_company']
    const missingHeaders = requiredFields.filter((f) => !headers.includes(f))
    if (missingHeaders.length > 0) {
      errors.push({
        row: 0,
        field: 'headers',
        message: `Missing required columns: ${missingHeaders.join(', ')}`,
      })
      return { parsed, errors }
    }

    const headerIndex = headers.reduce((acc, h, i) => {
      acc[h] = i
      return acc
    }, {} as Record<string, number>)

    rows.forEach((row, rowIndex) => {
      const actualRowNum = rowIndex + 2 // +2 because header is row 1, and we're 0-indexed

      const getValue = (field: string): string => {
        const idx = headerIndex[field]
        return idx !== undefined ? (row[idx] || '') : ''
      }

      const customerName = getValue('customer_name')
      const customerNumber = getValue('customer_number')
      const customerCompany = getValue('customer_company')
      const status = getValue('status')

      // Validate required fields
      if (!customerName) {
        errors.push({ row: actualRowNum, field: 'customer_name', message: 'customer_name is required' })
      }
      if (!customerNumber) {
        errors.push({ row: actualRowNum, field: 'customer_number', message: 'customer_number is required' })
      }
      if (!customerCompany) {
        errors.push({ row: actualRowNum, field: 'customer_company', message: 'customer_company is required' })
      }

      // Validate status if provided
      if (status && !QUOTE_STATUSES.includes(status as QuoteStatus)) {
        errors.push({
          row: actualRowNum,
          field: 'status',
          message: `Invalid status "${status}". Valid values: ${QUOTE_STATUSES.join(', ')}`,
        })
      }

      if (!customerName || !customerNumber || !customerCompany) {
        return // Skip this row
      }
      if (status && !QUOTE_STATUSES.includes(status as QuoteStatus)) {
        return // Skip this row
      }

      // Parse boolean fields
      const parseBool = (val: string): boolean | undefined => {
        if (!val) return undefined
        const lower = val.toLowerCase()
        if (lower === 'true' || lower === '1' || lower === 'yes') return true
        if (lower === 'false' || lower === '0' || lower === 'no') return false
        return undefined
      }

      parsed.push({
        customer_name: customerName,
        customer_number: customerNumber,
        customer_company: customerCompany,
        product_name: getValue('product_name') || undefined,
        documents_url: getValue('documents_url') || undefined,
        status: status || undefined,
        sales_order_number: getValue('sales_order_number') || undefined,
        custom_rug_sku: getValue('custom_rug_sku') || undefined,
        cad_file_url: getValue('cad_file_url') || undefined,
        image_render_url: getValue('image_render_url') || undefined,
        cad_requested: parseBool(getValue('cad_requested')),
        cad_approved: parseBool(getValue('cad_approved')),
        swatch_approved: parseBool(getValue('swatch_approved')),
        swatch_approved_by: getValue('swatch_approved_by') || undefined,
      })
    })

    return { parsed, errors }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const text = event.target?.result as string
      const { headers, rows } = parseCSV(text)
      const { parsed, errors } = validateAndParse(headers, rows)

      setParsedRows(parsed)
      setValidationErrors(errors)
      setImportResult(null)
      setIsOpen(true)
    }
    reader.readAsText(file)

    // Reset input so same file can be selected again
    e.target.value = ''
  }

  const handleImport = async () => {
    if (parsedRows.length === 0) return

    setIsImporting(true)
    try {
      const response = await fetch('/api/quotes/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsedRows),
      })

      const result = await response.json()

      if (!response.ok) {
        setImportResult({ success: 0, errors: [result.error || 'Import failed'] })
      } else {
        setImportResult({ success: result.imported, errors: result.errors || [] })
        if (result.imported > 0) {
          setTimeout(() => {
            setIsOpen(false)
            router.refresh()
          }, 2000)
        }
      }
    } catch (error) {
      setImportResult({ success: 0, errors: ['Network error. Please try again.'] })
    } finally {
      setIsImporting(false)
    }
  }

  const handleClose = () => {
    setIsOpen(false)
    setParsedRows([])
    setValidationErrors([])
    setImportResult(null)
  }

  return (
    <>
      <input
        type="file"
        ref={fileInputRef}
        accept=".csv"
        onChange={handleFileSelect}
        className="hidden"
      />
      <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
        Import CSV
      </Button>

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] flex flex-col">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Import Quotes</h2>
            </div>

            <div className="px-6 py-4 overflow-y-auto flex-1">
              {validationErrors.length > 0 && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
                  <h3 className="text-sm font-medium text-red-800 mb-2">Validation Errors</h3>
                  <ul className="text-sm text-red-700 space-y-1">
                    {validationErrors.slice(0, 10).map((error, idx) => (
                      <li key={idx}>
                        Row {error.row}: {error.message}
                      </li>
                    ))}
                    {validationErrors.length > 10 && (
                      <li>...and {validationErrors.length - 10} more errors</li>
                    )}
                  </ul>
                </div>
              )}

              {parsedRows.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">
                    Preview ({parsedRows.length} rows to import)
                  </h3>
                  <div className="overflow-x-auto border border-gray-200 rounded-md">
                    <table className="min-w-full divide-y divide-gray-200 text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                            Customer Name
                          </th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                            Customer #
                          </th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                            Company
                          </th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {parsedRows.slice(0, 5).map((row, idx) => (
                          <tr key={idx}>
                            <td className="px-3 py-2 whitespace-nowrap">{row.customer_name}</td>
                            <td className="px-3 py-2 whitespace-nowrap">{row.customer_number}</td>
                            <td className="px-3 py-2 whitespace-nowrap">{row.customer_company}</td>
                            <td className="px-3 py-2 whitespace-nowrap">{row.status || 'Inquiry'}</td>
                          </tr>
                        ))}
                        {parsedRows.length > 5 && (
                          <tr>
                            <td colSpan={4} className="px-3 py-2 text-center text-gray-500">
                              ...and {parsedRows.length - 5} more rows
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {importResult && (
                <div
                  className={`p-4 rounded-md ${
                    importResult.success > 0 ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                  }`}
                >
                  {importResult.success > 0 && (
                    <p className="text-sm text-green-800">
                      Successfully imported {importResult.success} quote(s). Refreshing...
                    </p>
                  )}
                  {importResult.errors.length > 0 && (
                    <ul className="text-sm text-red-700 space-y-1">
                      {importResult.errors.map((err, idx) => (
                        <li key={idx}>{err}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              {parsedRows.length === 0 && validationErrors.length === 0 && (
                <p className="text-gray-500 text-sm">No valid rows found in the CSV file.</p>
              )}
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                onClick={handleImport}
                disabled={parsedRows.length === 0 || isImporting || (importResult?.success ?? 0) > 0}
              >
                {isImporting ? 'Importing...' : `Import ${parsedRows.length} Quote(s)`}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
