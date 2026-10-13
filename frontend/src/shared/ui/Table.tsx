import type { ReactNode } from 'react'

interface TableProps {
  headers: ReactNode[]
  children: ReactNode
}

export function Table({ headers, children }: TableProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <table className="w-full text-sm">
        <thead className="bg-gray-50/80 text-left text-gray-600">
          <tr>
            {headers.map((h, i) => (
              <th key={i} className="px-4 py-3 font-medium text-xs uppercase tracking-wide text-gray-500">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">{children}</tbody>
      </table>
    </div>
  )
}