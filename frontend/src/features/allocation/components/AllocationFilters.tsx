import type { Discipline, Teacher } from '../../../shared/types'

export interface Filters {
  teacherId: string | 'all'
  disciplineId: string | 'all'
  type: 'all' | 'LECTURE' | 'PRACTICE'
}

interface Props {
  filters: Filters
  onChange: (filters: Filters) => void
  teachers: Teacher[]
  disciplines: Discipline[]
}

export function AllocationFilters({
  filters,
  onChange,
  teachers,
  disciplines,
}: Props) {
  const update = <K extends keyof Filters>(key: K, value: Filters[K]) =>
    onChange({ ...filters, [key]: value })

  const selectClass =
    'border rounded px-2 py-1 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500'

  return (
    <div className="flex flex-wrap gap-3 items-center">
      <label className="flex items-center gap-2 text-sm text-gray-600">
        Преподаватель:
        <select
          value={filters.teacherId}
          onChange={(e) => update('teacherId', e.target.value)}
          className={selectClass}
        >
          <option value="all">Все</option>
          {teachers.map((t) => (
            <option key={t.id} value={t.id}>
              {t.fullName}
            </option>
          ))}
        </select>
      </label>

      <label className="flex items-center gap-2 text-sm text-gray-600">
        Дисциплина:
        <select
          value={filters.disciplineId}
          onChange={(e) => update('disciplineId', e.target.value)}
          className={selectClass}
        >
          <option value="all">Все</option>
          {disciplines.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
      </label>

      <label className="flex items-center gap-2 text-sm text-gray-600">
        Тип:
        <select
          value={filters.type}
          onChange={(e) => update('type', e.target.value as Filters['type'])}
          className={selectClass}
        >
          <option value="all">Все</option>
          <option value="LECTURE">Лекции</option>
          <option value="PRACTICE">Практики</option>
        </select>
      </label>
    </div>
  )
}