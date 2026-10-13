import { useState } from 'react'
import { useScheduleGrid, useGenerateSchedule } from '../features/schedule/hooks'
import { fetchGenerateInfo } from '../features/schedule/api'
import type { GenerateInfo, GenerateResult } from '../features/schedule/api'
import { EditPairModal } from '../features/schedule/EditPairModal'
import { useAuthStore } from '../stores/authStore'
import { useAllocationStore } from '../stores/allocationStore'
import { Spinner } from '../shared/ui/Spinner'
import { PageHeader } from '../shared/ui/PageHeader'
import { Button } from '../shared/ui/Button'

const PAIR_TIMES: Record<number, string> = {
  1: '08:20–09:55',
  2: '10:05–11:40',
  3: '12:20–13:55',
  4: '14:05–15:40',
  5: '15:50–17:25',
  6: '17:35–19:10',
}

const DAY_NAMES = [
  '',
  'Понедельник',
  'Вторник',
  'Среда',
  'Четверг',
  'Пятница',
  'Суббота',
]

const typeShort: Record<string, string> = {
  LECTURE: 'лек.',
  PRACTICE: 'практ.',
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr)
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

function formatDateShort(dateStr: string): string {
  const d = new Date(dateStr)
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  return `${day}.${month}`
}

type ModalState =
  | {
      mode: 'edit'
      existing: {
        id: string
        workloadId: string
        date: string
        pairNumber: number
        audienceId: string
      }
    }
  | { mode: 'create'; date: string; pairNumber: number }
  | null

export function SchedulePage() {
  const user = useAuthStore((s) => s.user)
  const isAdmin = user?.role === 'ADMIN'

  const [weekStart, setWeekStart] = useState<string>('2026-09-07')
  const [modalState, setModalState] = useState<ModalState>(null)

  const [info, setInfo] = useState<GenerateInfo | null>(null)
  const [showConfirm, setShowConfirm] = useState(false)
  const [genResult, setGenResult] = useState<GenerateResult | null>(null)
  const [showResult, setShowResult] = useState(false)

  const setClipped = useAllocationStore((s) => s.setClipped)

  const grid = useScheduleGrid(weekStart)
  const generateS = useGenerateSchedule()

  if (grid.isLoading) return <Spinner />
  if (grid.isError) return <p className="text-red-600">Ошибка загрузки</p>
  if (!grid.data) return null

  const cellMap = new Map<string, any>()
  for (const c of grid.data.cells) {
    cellMap.set(`${c.day}-${c.pair}-${c.groupId}`, c)
  }

  const handleWeekNav = (delta: number) => {
    setWeekStart(addDays(weekStart, delta * 7))
  }

  const handleGenerate = async () => {
    try {
      const data = await fetchGenerateInfo()
      setInfo(data)
      setShowConfirm(true)
    } catch (e: any) {
      alert(e.response?.data?.error ?? 'Ошибка')
    }
  }

  const confirmGenerate = async () => {
    setShowConfirm(false)
    try {
      const result = await generateS.mutateAsync()
      setClipped(result.clipped)
      setGenResult(result)
      setShowResult(true)
    } catch (e: any) {
      alert(e.response?.data?.error ?? 'Ошибка генерации')
    }
  }

  const handleEmptyClick = (date: string, pairNumber: number) => {
    if (!isAdmin) return
    setModalState({ mode: 'create', date, pairNumber })
  }

  const handleCellClick = (cell: any) => {
    if (!isAdmin) return
    setModalState({
      mode: 'edit',
      existing: {
        id: cell.id,
        workloadId: cell.workloadId,
        date: cell.date,
        pairNumber: cell.pair,
        audienceId: cell.audienceId,
      },
    })
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Расписание"
        subtitle={`Неделя ${formatDateShort(grid.data.weekStart)} — ${formatDateShort(grid.data.weekEnd)}`}
        actions={
          isAdmin ? (
            <Button
              variant="secondary"
              onClick={handleGenerate}
              disabled={generateS.isPending}
            >
              {generateS.isPending ? 'Генерация...' : 'Сгенерировать'}
            </Button>
          ) : undefined
        }
      />

      <div className="flex items-center gap-3">
        <button
          onClick={() => handleWeekNav(-1)}
          className="px-3 py-1.5 text-sm border rounded hover:bg-gray-50"
        >
          ← Предыдущая
        </button>
        <button
          onClick={() => handleWeekNav(1)}
          className="px-3 py-1.5 text-sm border rounded hover:bg-gray-50"
        >
          Следующая →
        </button>
        <input
          type="date"
          value={weekStart}
          onChange={(e) => {
            const d = new Date(e.target.value)
            const day = d.getDay()
            const diff = day === 0 ? -6 : 1 - day
            d.setDate(d.getDate() + diff)
            setWeekStart(d.toISOString().slice(0, 10))
          }}
          className="border rounded px-3 py-1.5 text-sm"
        />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse bg-white rounded-xl overflow-hidden shadow-sm">
          <thead>
            <tr className="bg-gray-50">
              <th className="border border-gray-200 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase w-32">
                Пара
              </th>
              {grid.data.groups.map((g) => (
                <th
                  key={g.id}
                  className="border border-gray-200 px-3 py-2 text-left text-sm font-semibold text-gray-700"
                >
                  {g.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[1, 2, 3, 4, 5, 6].map((day) =>
              [1, 2, 3, 4, 5, 6].map((pair) => {
                const isFirstPairOfDay = pair === 1
                const dayDate = addDays(weekStart, day - 1)

                return (
                  <tr
                    key={`${day}-${pair}`}
                    className={
                      isFirstPairOfDay && day > 1
                        ? 'border-t-2 border-gray-300'
                        : ''
                    }
                  >
                    <td className="border border-gray-200 px-3 py-2 align-top bg-gray-50">
                      {isFirstPairOfDay && (
                        <div className="font-semibold text-sm text-gray-800 mb-1">
                          {DAY_NAMES[day]}
                        </div>
                      )}
                      <div className="text-xs text-gray-500">{pair} пара</div>
                      <div className="text-xs text-gray-400">
                        {PAIR_TIMES[pair]}
                      </div>
                    </td>
                    {grid.data!.groups.map((g) => {
                      const cell = cellMap.get(`${day}-${pair}-${g.id}`)
                      if (cell) {
                        return (
                          <td
                            key={g.id}
                            className={`border border-gray-200 px-3 py-2 align-top cursor-pointer transition ${
                              cell.type === 'LECTURE'
                                ? 'bg-blue-50 hover:bg-blue-100'
                                : 'bg-green-50 hover:bg-green-100'
                            }`}
                            onClick={() => handleCellClick(cell)}
                          >
                            <div className="text-sm space-y-0.5">
                              <div className="font-medium text-gray-900">
                                {cell.disciplineName}{' '}
                                <span className="text-xs text-gray-500 font-normal">
                                  ({typeShort[cell.type]})
                                </span>
                              </div>
                              <div className="text-xs text-gray-600">
                                {cell.teacherName ?? '—'}
                              </div>
                              <div className="text-xs text-gray-500">
                                ауд. {cell.audienceName ?? '—'}
                              </div>
                            </div>
                          </td>
                        )
                      }
                      return (
                        <td
                          key={g.id}
                          className={`border border-gray-200 px-3 py-2 align-top ${
                            isAdmin ? 'cursor-pointer hover:bg-gray-50' : ''
                          }`}
                          onClick={() => handleEmptyClick(dayDate, pair)}
                        >
                          <div className="text-xs text-gray-300">—</div>
                        </td>
                      )
                    })}
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center gap-4 text-xs text-gray-500">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-blue-50 border border-blue-200" />
          Лекция
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-green-50 border border-green-200" />
          Практика
        </span>
        {isAdmin && (
          <span className="text-gray-400">
            · Клик по паре — редактировать. Клик по пустой клетке — создать.
          </span>
        )}
      </div>

      {modalState && (
        <EditPairModal
          existing={modalState.mode === 'edit' ? modalState.existing : null}
          initial={
            modalState.mode === 'create'
              ? { date: modalState.date, pairNumber: modalState.pairNumber }
              : undefined
          }
          onClose={() => setModalState(null)}
        />
      )}

      {showConfirm && info && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
          onClick={() => setShowConfirm(false)}
        >
          <div
            className="bg-white rounded-xl p-6 w-full max-w-lg space-y-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold">Генерация расписания</h2>

            <div className="text-sm space-y-2 text-gray-700">
              <p>
                Период: <b>{info.startDate}</b> — <b>{info.endDate}</b> (
                {info.weeksCount} недель)
              </p>

              <div className="border-t border-gray-100 pt-2 mt-2 space-y-1">
                <p>
                  Нагрузок: <b>{info.totalWorkloads}</b>
                </p>
                <p>
                  Групп: <b>{info.totalGroups}</b>
                </p>
                <p>
                  Всего пар за семестр: <b>{info.totalPairs}</b>
                </p>
                <p>
                  Доступно слотов: <b>{info.totalSlots}</b>
                </p>
              </div>

              <div className="border-t border-gray-100 pt-2 mt-2 space-y-1">
                <p className="font-medium text-gray-600">
                  Нагрузок на группу:
                </p>
                {info.groupWorkloads.map((g) => (
                  <p key={g.name} className="text-xs text-gray-600">
                    {g.name}: <b>{g.count}</b> нагрузок
                  </p>
                ))}
              </div>

              <p className="text-xs text-red-600 pt-2">
                Все текущие пары будут удалены. Действие нельзя отменить.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowConfirm(false)}
                className="px-4 py-2 text-sm text-gray-600"
              >
                Отмена
              </button>
              <button
                onClick={confirmGenerate}
                disabled={generateS.isPending}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded disabled:opacity-50"
              >
                {generateS.isPending ? 'Генерация...' : 'Генерировать'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showResult && genResult && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
          onClick={() => setShowResult(false)}
        >
          <div
            className="bg-white rounded-xl p-6 w-full max-w-2xl space-y-4 max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold">
              {genResult.clipped.length === 0
                ? 'Расписание создано'
                : 'Расписание создано с потерями'}
            </h2>

            <div className="text-sm text-gray-700">
              <p>
                Создано пар: <b>{genResult.created}</b>
              </p>
              {genResult.clipped.length > 0 && (
                <p className="text-red-600 mt-1">
                  Нагрузок с потерями: <b>{genResult.clipped.length}</b>
                </p>
              )}
            </div>

            {genResult.clipped.length > 0 && (
              <div className="border border-red-200 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-red-50 text-left text-gray-700">
                    <tr>
                      <th className="px-3 py-2 font-medium">Дисциплина</th>
                      <th className="px-3 py-2 font-medium">Тип</th>
                      <th className="px-3 py-2 font-medium">Группы</th>
                      <th className="px-3 py-2 font-medium text-right">
                        Хотели
                      </th>
                      <th className="px-3 py-2 font-medium text-right">
                        Создано
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-red-100">
                    {genResult.clipped.map((c, i) => (
                      <tr key={i}>
                        <td className="px-3 py-2">{c.disciplineName}</td>
                        <td className="px-3 py-2 text-gray-600">
                          {c.type === 'LECTURE' ? 'Лекция' : 'Практика'}
                        </td>
                        <td className="px-3 py-2 text-gray-600">
                          {c.groupNames.join(', ')}
                        </td>
                        <td className="px-3 py-2 text-right">{c.wanted}</td>
                        <td className="px-3 py-2 text-right text-red-600 font-medium">
                          {c.created}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {genResult.clipped.length > 0 && (
              <p className="text-xs text-gray-500">
                Нагрузки с потерями подсвечены на странице «Распределение».
              </p>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowResult(false)}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Понятно
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}