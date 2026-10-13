import { useState } from 'react'
import type { Discipline, Teacher } from '../../shared/types'
import { useSetTeacherCompetencies } from './hooks'

interface Props {
  teacher: Teacher & { disciplineIds: string[] }
  disciplines: Discipline[]
  onClose: () => void
}

export function CompetenciesModal({ teacher, disciplines, onClose }: Props) {
  const [selected, setSelected] = useState<Set<string>>(
    new Set(teacher.disciplineIds)
  )
  const save = useSetTeacherCompetencies()

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleSave = async () => {
    if (!teacher.id) {
      alert('Ошибка: не удалось определить ID преподавателя')
      return
    }

    const disciplineIds = Array.from(selected).filter(
      (id) => typeof id === 'string' && id.length > 0
    )

    try {
      await save.mutateAsync({
        id: teacher.id,
        disciplineIds,
      })
      onClose()
    } catch (e: any) {
      const status = e.response?.status
      const serverError = e.response?.data?.error
      const message = e.message ?? ''

      if (serverError) {
        alert(`Ошибка: ${serverError}`)
      } else if (status) {
        alert(`Ошибка сервера (HTTP ${status})`)
      } else if (message) {
        alert(`Ошибка сети: ${message}`)
      } else {
        alert('Неизвестная ошибка. Проверьте консоль и Network.')
      }
      console.error('Save competencies failed:', e)
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold text-gray-900 mb-1">
          Компетенции
        </h2>
        <p className="text-sm text-gray-500 mb-4">{teacher.fullName}</p>

        <div className="flex-1 overflow-y-auto border border-gray-200 rounded-lg p-3 space-y-1 mb-4">
          {disciplines.map((d) => (
            <label
              key={d.id}
              className="flex items-center gap-2 py-1.5 cursor-pointer hover:bg-gray-50 rounded-md px-2 transition"
            >
              <input
                type="checkbox"
                checked={selected.has(d.id)}
                onChange={() => toggle(d.id)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">{d.name}</span>
            </label>
          ))}
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-400">
            Выбрано: {selected.size}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 rounded-lg hover:bg-gray-100 transition"
            >
              Отмена
            </button>
            <button
              onClick={handleSave}
              disabled={save.isPending}
              className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 font-medium shadow-sm transition"
            >
              {save.isPending ? 'Сохранение...' : 'Сохранить'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}