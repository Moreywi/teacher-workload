import type { ReactNode } from 'react'
import clsx from 'clsx'

interface Props {
  children: ReactNode
  color?: 'blue' | 'green' | 'red' | 'amber' | 'gray' | 'purple'
  size?: 'sm' | 'md'
}

const colors = {
  blue: 'bg-blue-50 text-blue-700 border-blue-100',
  green: 'bg-green-50 text-green-700 border-green-100',
  red: 'bg-red-50 text-red-700 border-red-100',
  amber: 'bg-amber-50 text-amber-700 border-amber-100',
  gray: 'bg-gray-50 text-gray-600 border-gray-200',
  purple: 'bg-purple-50 text-purple-700 border-purple-100',
} as const

export function Badge({ children, color = 'gray', size = 'sm' }: Props) {
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-md border font-medium',
        colors[color],
        size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-2.5 py-1'
      )}
    >
      {children}
    </span>
  )
}