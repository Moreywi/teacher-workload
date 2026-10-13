import type { ButtonHTMLAttributes, ReactNode } from 'react'
import clsx from 'clsx'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'ghost'
  size?: 'sm' | 'md'
  children: ReactNode
}

const variants = {
  primary:
    'bg-blue-600 hover:bg-blue-700 text-white shadow-sm disabled:bg-blue-400',
  secondary:
    'bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 disabled:opacity-50',
  success:
    'bg-green-600 hover:bg-green-700 text-white shadow-sm disabled:bg-green-400',
  warning:
    'bg-amber-100 hover:bg-amber-200 text-amber-800 disabled:opacity-50',
  danger: 'bg-red-600 hover:bg-red-700 text-white shadow-sm',
  ghost:
    'text-gray-600 hover:bg-gray-100 disabled:opacity-50',
} as const

const sizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
} as const

export function Button({
  variant = 'primary',
  size = 'sm',
  className,
  children,
  ...rest
}: Props) {
  return (
    <button
      className={clsx(
        'rounded-lg font-medium transition disabled:cursor-not-allowed inline-flex items-center gap-1.5',
        variants[variant],
        sizes[size],
        className
      )}
      {...rest}
    >
      {children}
    </button>
  )
}