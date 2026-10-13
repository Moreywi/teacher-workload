import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import type { Workload } from '../../../shared/types'

interface Props {
  workloads: Workload[]
}

const COLORS = {
  LECTURE: '#3b82f6',
  PRACTICE: '#22c55e',
}

const LABELS = {
  LECTURE: 'Лекции',
  PRACTICE: 'Практики',
}

export function WorkloadTypeChart({ workloads }: Props) {
  const lecturePairs = workloads
    .filter((w) => w.type === 'LECTURE')
    .reduce((s, w) => s + w.pairs, 0)
  const practicePairs = workloads
    .filter((w) => w.type === 'PRACTICE')
    .reduce((s, w) => s + w.pairs, 0)

  const data = [
    { name: LABELS.LECTURE, key: 'LECTURE', value: lecturePairs },
    { name: LABELS.PRACTICE, key: 'PRACTICE', value: practicePairs },
  ].filter((d) => d.value > 0)

  return (
    <div className="bg-white rounded-lg border p-4">
      <h3 className="text-sm font-medium text-gray-700 mb-3">
        Распределение по типам занятий
      </h3>
      <div style={{ width: '100%', height: 320 }}>
        <ResponsiveContainer>
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={2}
            >
              {data.map((entry) => (
                <Cell
                  key={entry.key}
                  fill={COLORS[entry.key as keyof typeof COLORS]}
                />
              ))}
            </Pie>
            <Tooltip
              formatter={(value) => {
                const num = Number(value ?? 0)
                return [`${num} пар (${(num * 1.5).toFixed(1)} ч)`, 'Нагрузка']
              }}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}