import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ActivityLog } from '@/lib/types'
import { ActivityLogFilter } from './ActivityLogFilter'

interface SearchParams {
  action_type?: string
  start_date?: string
  end_date?: string
}

function formatActionType(actionType: string): string {
  const labels: Record<string, string> = {
    quote_created: 'Quote Created',
    quote_updated: 'Quote Updated',
    quote_deleted: 'Quote Deleted',
    status_changed: 'Status Changed',
    cad_approved: 'CAD Approved',
    swatch_approved: 'Swatch Approved',
  }
  return labels[actionType] || actionType
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

function getActionBadgeColor(actionType: string): string {
  switch (actionType) {
    case 'quote_created':
      return 'bg-green-100 text-green-800'
    case 'quote_updated':
      return 'bg-blue-100 text-blue-800'
    case 'quote_deleted':
      return 'bg-red-100 text-red-800'
    case 'status_changed':
      return 'bg-purple-100 text-purple-800'
    case 'cad_approved':
      return 'bg-amber-100 text-amber-800'
    case 'swatch_approved':
      return 'bg-teal-100 text-teal-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

export default async function ActivityLogPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const supabase = await createClient()

  // Check auth
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/admin/login')
  }

  const params = await searchParams
  const actionType = params.action_type || 'all'
  const startDate = params.start_date || ''
  const endDate = params.end_date || ''

  // Build query
  let query = supabase
    .from('activity_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200)

  if (actionType && actionType !== 'all') {
    query = query.eq('action_type', actionType)
  }

  if (startDate) {
    query = query.gte('created_at', startDate)
  }

  if (endDate) {
    const endDateObj = new Date(endDate)
    endDateObj.setDate(endDateObj.getDate() + 1)
    query = query.lt('created_at', endDateObj.toISOString())
  }

  const { data: logs, error } = await query

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-red-600">Error loading activity logs: {error.message}</div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-jl-charcoal">Activity Log</h1>
        <Link
          href="/admin/quotes"
          className="text-sm text-jl-gold hover:text-jl-gold-dark transition-colors"
        >
          Back to Quotes
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-jl-border">
        <div className="p-4 border-b border-jl-border">
          <ActivityLogFilter
            currentActionType={actionType}
            currentStartDate={startDate}
            currentEndDate={endDate}
          />
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date/Time
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Action
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quote #
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Performed By
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Details
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {(logs as ActivityLog[]).length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                    No activity logs found matching your filters.
                  </td>
                </tr>
              ) : (
                (logs as ActivityLog[]).map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                      {formatDate(log.created_at)}
                    </td>
                    <td className="px-4 py-3 text-sm whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getActionBadgeColor(log.action_type)}`}
                      >
                        {formatActionType(log.action_type)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                      {log.quote_number ? (
                        log.quote_id ? (
                          <Link
                            href={`/admin/quotes/${log.quote_id}`}
                            className="text-jl-gold hover:text-jl-gold-dark"
                          >
                            {log.quote_number}
                          </Link>
                        ) : (
                          <span className="text-gray-400">{log.quote_number}</span>
                        )
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                      {log.performed_by}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {log.details || '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {(logs as ActivityLog[]).length > 0 && (
          <div className="px-4 py-3 border-t border-gray-200 text-sm text-gray-500">
            Showing {(logs as ActivityLog[]).length} {(logs as ActivityLog[]).length === 1 ? 'entry' : 'entries'}
            {(logs as ActivityLog[]).length === 200 && ' (limit reached)'}
          </div>
        )}
      </div>
    </div>
  )
}
