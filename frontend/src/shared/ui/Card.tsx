import type { ReactNode } from 'react'
import clsx from 'clsx'
import { Link } from 'react-router-dom'

interface CardProps {
  children: ReactNode
  className?: string
  padded?: boolean
  hoverable?: boolean
}

export function Card({
  children,
  className,
  padded = true,
  hoverable = false,
}: CardProps) {
  return (
    <div
      className={clsx(
        'bg-white border border-gray-200 rounded-xl shadow-sm',
        padded && 'p-5',
        hoverable && 'hover:shadow-md hover:-translate-y-0.5 transition-all duration-150',
        className
      )}
    >
      {children}
    </div>
  )
}

interface StatCardProps {
  icon: string
  label: string
  value: number | string
  accent?: 'blue' | 'purple' | 'indigo' | 'green' | 'gray' | 'red' | 'amber'
  suffix?: string
  hint?: string
  to?: string
}

const accentMap = {
  blue: 'bg-blue-50 text-blue-600',
  purple: 'bg-purple-50 text-purple-600',
  indigo: 'bg-indigo-50 text-indigo-600',
  green: 'bg-green-50 text-green-600',
  gray: 'bg-gray-100 text-gray-600',
  red: 'bg-red-50 text-red-600',
  amber: 'bg-amber-50 text-amber-600',
} as const

export function StatCard({
  icon,
  label,
  value,
  accent = 'blue',
  suffix = '',
  hint,
  to,
}: StatCardProps) {
  const inner = (
    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-150">
      <div
        className={clsx(
          'w-10 h-10 rounded-lg flex items-center justify-center text-lg mb-3',
          accentMap[accent]
        )}
      >
        {icon}
      </div>
      <div className="text-2xl font-semibold text-gray-900">
        {value}
        {suffix}
      </div>
      <div className="text-sm text-gray-500 mt-0.5">{label}</div>
      {hint && <div className="text-xs text-gray-400 mt-1">{hint}</div>}
    </div>
  )

  if (to) {
    return (
      <Link to={to} className="block">{inner}</Link>
    )
  }
  return inner
}