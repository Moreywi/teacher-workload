import { useState, useMemo } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import {
  useCreateSchedule,
  useUpdateSchedule,
  useDeleteSchedule,
} from './hooks'
import { useAudiences } from '../audiences/hooks'
import { useAllocationSnapshot } from '../allocation/hooks'
import { useTeachers } from '../teachers/hooks'

const PAIR_TIMES: Record<number, string> = {
  1: '08:20–09:55',
  2: '10:05–11:40',
  3: '12:20–13:55',
  4: '14:05–15:40',
  5: '15:50–17:25',
  6: '17:35–19:10',
}

interface ExistingPair {
  id: string
  workloadId: string
  date: string
  pairNumber: number
  audienceId: string
}

interface Props {
  existing: ExistingPair | null
  initial?: { date?: string; pairNumber?: number }
  onClose: () => void
}

export function EditPairModal({ existing, initial, onClose }: Props) {
  const isEdit = existing !== null

  const qc = useQueryClient()
  const snapshot = useAllocationSnapshot()
  const audiences = useAudiences()
  const teachers = useTeachers()
  const createS = useCreateSchedule()
  const updateS = useUpdateSchedule()
  const deleteS = useDeleteSchedule()

  const [workloadId, setWorkloadId] = useState(existing?.workloadId ?? '')
  const [date, setDate] = useState(existing?.date ?? initial?.date ?? '')
  const [pairNumber, setPairNumber] = useState(
    existing?.pairNumber ?? initial?.pairNumber ?? 1
  )
  const [audienceId, setAudienceId] = useState(existing?.audienceId ?? '')
  const [saving, setSaving] = useState(false)

  const workloads = snapshot.data?.workloads ?? []
  const disciplines = snapshot.data?.disciplines ?? []
  const groups = snapshot.data?.groups ?? []
  const allocations = snapshot.data?.allocations ?? []
  const teacherList = teachers.data ?? []

  const teacherById = useMemo(
    () => Object.fromEntries(teacherList.map((t) => [t.id, t])),
    [teacherList]
  )
  const allocationByWorkload = useMemo(
    () => Object.fromEntries(allocations.map((a) => [a.workloadId, a])),
    [allocations]
  )

  const selectedWorkload = workloads.find((w) => w.id === workloadId)
  const selectedDisciplineId = selectedWorkload?.disciplineId ?? ''
  const selectedType = selectedWorkload?.type ?? ''
  const selectedGroupIds = selectedWorkload?.groupIds ?? []
  const singleGroupId = selectedGroupIds[0] ?? ''

  const handleDisciplineChange = (newDisciplineId: string) => {
    const candidates = workloads.filter(
      (w) => w.disciplineId === newDisciplineId
    )
    setWorkloadId(candidates[0]?.id ?? '')
  }

  const handleTypeChange = (newType: 'LECTURE' | 'PRACTICE') => {
    const candidates = workloads.filter(
      (w) => w.disciplineId === selectedDisciplineId && w.type === newType
    )
    setWorkloadId(candidates[0]?.id ?? '')
  }

  const handleGroupChange = (groupId: string) => {
    const candidates = workloads.filter(
      (w) =>
        w.disciplineId === selectedDisciplineId &&
        w.type === selectedType &&
        w.groupIds.includes(groupId)
    )
    setWorkloadId(candidates[0]?.id ?? '')
  }

  const handleSave = async () => {
    if (!workloadId || !date || !audienceId) {
      alert('Заполните все поля')
      return
    }
    setSaving(true)
    try {
      if (isEdit) {
        await updateS.mutateAsync({
          id: existing.id,
          dto: { workloadId, date, pairNumber, audienceId },
        })
      } else {
        await createS.mutateAsync({
          workloadId,
          date,
          pairNumber,
          audienceId,
        })
      }
      await qc.refetchQueries({ queryKey: ['schedule'] })
      onClose()
    } catch (e: any) {
      alert(e.response?.data?.error ?? 'Ошибка сохранения')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!isEdit) return
    if (!confirm('Удалить эту пару?')) return
    try {
      await deleteS.mutateAsync(existing.id)
      await qc.refetchQueries({ queryKey: ['schedule'] })
      onClose()
    } catch (e: any) {
      alert(e.response?.data?.error ?? 'Ошибка удаления')
    }
  }

  const allocation = workloadId ? allocationByWorkload[workloadId] : null
  const teacher = allocation ? teacherById[allocation.teacherId] : null

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl p-6 w-full max-w-md space-y-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            {isEdit ? 'Редактировать пару' : 'Новая пара'}
          </h2>
          {isEdit && (
            <button
              onClick={handleDelete}
              className="text-sm text-red-600 hover:text-red-700"
            >
              Удалить
            </button>
          )}
        </div>

        <div>
          <label className="block text-sm text-gray-700 mb-1">Дисциплина</label>
          <select
            value={selectedDisciplineId}
            onChange={(e) => handleDisciplineChange(e.target.value)}
            className="w-full border rounded px-3 py-2 text-sm"
          >
            <option value="">— выберите —</option>
            {disciplines.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm text-gray-700 mb-1">Тип</label>
          <select
            value={selectedType}
            onChange={(e) =>
              handleTypeChange(e.target.value as 'LECTURE' | 'PRACTICE')
            }
            disabled={!selectedDisciplineId}
            className="w-full border rounded px-3 py-2 text-sm disabled:bg-gray-50 disabled:text-gray-400"
          >
            <option value="">— выберите —</option>
            <option value="LECTURE">Лекция</option>
            <option value="PRACTICE">Практика</option>
          </select>
        </div>

        <div>
          <label className="block text-sm text-gray-700 mb-1">Группа</label>
          <select
            value={singleGroupId}
            onChange={(e) => handleGroupChange(e.target.value)}
            disabled={!selectedDisciplineId || !selectedType}
            className="w-full border rounded px-3 py-2 text-sm disabled:bg-gray-50 disabled:text-gray-400"
          >
            <option value="">— выберите —</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
        </div>

        {teacher && (
          <div className="text-xs text-gray-500">
            Преподаватель:{' '}
            <span className="text-gray-700 font-medium">
              {teacher.fullName}
            </span>
          </div>
        )}

        <div>
          <label className="block text-sm text-gray-700 mb-1">Дата</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full border rounded px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-700 mb-1">Номер пары</label>
          <select
            value={pairNumber}
            onChange={(e) => setPairNumber(Number(e.target.value))}
            className="w-full border rounded px-3 py-2 text-sm"
          >
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <option key={n} value={n}>
                {n} пара ({PAIR_TIMES[n]})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm text-gray-700 mb-1">Аудитория</label>
          <select
            value={audienceId}
            onChange={(e) => setAudienceId(e.target.value)}
            className="w-full border rounded px-3 py-2 text-sm"
          >
            <option value="">— выберите —</option>
            {(audiences.data ?? []).map((a) => (
              <option key={a.id} value={a.id}>
                {a.name} {a.capacity ? `(${a.capacity} мест)` : ''}
              </option>
            ))}
          </select>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600">
            Отмена
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded disabled:opacity-50"
          >
            {saving ? 'Сохранение...' : isEdit ? 'Сохранить' : 'Создать'}
          </button>
        </div>
      </div>
    </div>
  )
}