export const QUOTE_STATUSES = [
  'Inquiry',
  'Accepted',
  'CAD Created',
  'Swatch Ordered',
  'Swatch Creation',
  'Swatch Shipped',
  'Swatch Approval Pending',
  'Swatch Approved',
  'Order Created',
  'On Loom',
  'Finishing',
  'In Transit',
  'Complete',
] as const

export type QuoteStatus = (typeof QUOTE_STATUSES)[number]

export const STATUS_COLORS: Record<QuoteStatus, { bg: string; text: string }> = {
  'Inquiry': { bg: 'bg-gray-100', text: 'text-gray-700' },
  'Accepted': { bg: 'bg-blue-100', text: 'text-blue-700' },
  'CAD Created': { bg: 'bg-purple-100', text: 'text-purple-700' },
  'Swatch Ordered': { bg: 'bg-yellow-100', text: 'text-yellow-700' },
  'Swatch Creation': { bg: 'bg-yellow-100', text: 'text-yellow-700' },
  'Swatch Shipped': { bg: 'bg-orange-100', text: 'text-orange-700' },
  'Swatch Approval Pending': { bg: 'bg-orange-100', text: 'text-orange-700' },
  'Swatch Approved': { bg: 'bg-green-100', text: 'text-green-700' },
  'Order Created': { bg: 'bg-teal-100', text: 'text-teal-700' },
  'On Loom': { bg: 'bg-indigo-100', text: 'text-indigo-700' },
  'Finishing': { bg: 'bg-indigo-100', text: 'text-indigo-700' },
  'In Transit': { bg: 'bg-cyan-100', text: 'text-cyan-700' },
  'Complete': { bg: 'bg-green-100', text: 'text-green-700' },
}
