import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
} from 'recharts'
import type { Teacher } from '../../../shared/types'

interface Props {
  teachers: Teacher[]
  loadByTeacher: Record<string, number>
}

export function TeachersLoadChart({ teachers, loadByTeacher }: Props) {
  const data = teachers.map((t) => ({
    name: t.fullName,
    pairs: loadByTeacher[t.id] ?? 0,
  }))

  const total = data.reduce((sum, d) => sum + d.pairs, 0)
  const avg = data.length > 0 ? total / data.length : 0
  const highThreshold = avg * 1.2

  const colorFor = (pairs: number) => {
    if (pairs === 0) return '#9ca3af'
    if (pairs > highThreshold) return '#ef4444'
    if (pairs < avg * 0.8) return '#3b82f6' 
    return '#22c55e'
  }

  return (
    <div className="bg-white rounded-lg border p-4">
      <h3 className="text-sm font-medium text-gray-700 mb-3">
        Загрузка преподавателей (пар)
      </h3>
      <div style={{ width: '100%', height: 320 }}>
        <ResponsiveContainer>
          <BarChart
            data={data}
            margin={{ top: 8, right: 16, left: 0, bottom: 40 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="name"
              angle={-30}
              textAnchor="end"
              interval={0}
              tick={{ fontSize: 12 }}
            />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip
              formatter={(value) => {
                const num = Number(value ?? 0)
                return [`${num} пар (${(num * 1.5).toFixed(1)} ч)`, 'Нагрузка']
              }}
            />
            <Bar dataKey="pairs" radius={[4, 4, 0, 0]}>
              {data.map((entry, i) => (
                <Cell key={i} fill={colorFor(entry.pairs)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="flex gap-4 text-xs text-gray-500 mt-2 justify-center">
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 bg-green-500 rounded-sm" /> норма
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 bg-blue-500 rounded-sm" /> ниже средней
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 bg-red-500 rounded-sm" /> выше средней на 20%+
        </span>
      </div>
    </div>
  )
}