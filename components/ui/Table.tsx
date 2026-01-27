import { HTMLAttributes, TdHTMLAttributes, ThHTMLAttributes } from 'react'

interface TableProps extends HTMLAttributes<HTMLTableElement> {}

function Table({ className = '', children, ...props }: TableProps) {
  return (
    <div className="w-full overflow-x-auto">
      <table
        className={`w-full border-collapse ${className}`}
        {...props}
      >
        {children}
      </table>
    </div>
  )
}

interface TableHeaderProps extends HTMLAttributes<HTMLTableSectionElement> {}

function TableHeader({ className = '', children, ...props }: TableHeaderProps) {
  return (
    <thead
      className={`bg-jl-offwhite ${className}`}
      {...props}
    >
      {children}
    </thead>
  )
}

interface TableBodyProps extends HTMLAttributes<HTMLTableSectionElement> {}

function TableBody({ className = '', children, ...props }: TableBodyProps) {
  return (
    <tbody className={className} {...props}>
      {children}
    </tbody>
  )
}

interface TableRowProps extends HTMLAttributes<HTMLTableRowElement> {}

function TableRow({ className = '', children, ...props }: TableRowProps) {
  return (
    <tr
      className={`border-b border-jl-border hover:bg-jl-offwhite/50 transition-colors ${className}`}
      {...props}
    >
      {children}
    </tr>
  )
}

interface TableHeadProps extends ThHTMLAttributes<HTMLTableCellElement> {}

function TableHead({ className = '', children, ...props }: TableHeadProps) {
  return (
    <th
      className={`px-4 py-3 text-left text-xs font-semibold text-jl-charcoal uppercase tracking-wider ${className}`}
      {...props}
    >
      {children}
    </th>
  )
}

interface TableCellProps extends TdHTMLAttributes<HTMLTableCellElement> {}

function TableCell({ className = '', children, ...props }: TableCellProps) {
  return (
    <td
      className={`px-4 py-3 text-sm text-jl-charcoal ${className}`}
      {...props}
    >
      {children}
    </td>
  )
}

export { Table, TableHeader, TableBody, TableRow, TableHead, TableCell }
