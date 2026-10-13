import { useMemo, useState } from 'react'
import {
  useAllocationSnapshot,
  useGenerateWorkloads,
  useRunAllocation,
  useSetOverride,
  useResetManual,
} from '../features/allocation/hooks'
import {
  useUpdateWorkload,
  useDeleteWorkload,
} from '../features/workloads/hooks'
import { EditablePairsCell } from '../features/workloads/EditablePairsCell'
import { WorkloadModal } from '../features/workloads/WorkloadModal'
import { indexById, pairsToHours } from '../features/allocation/helpers'
import { useAllocationStore } from '../stores/allocationStore'
import { Spinner } from '../shared/ui/Spinner'
import { Table } from '../shared/ui/Table'
import { PageHeader } from '../shared/ui/PageHeader'
import { Button } from '../shared/ui/Button'
import { StatCard } from '../shared/ui/Card'
import { TeachersLoadChart } from '../features/allocation/components/TeachersLoadChart'
import { WorkloadTypeChart } from '../features/allocation/components/WorkloadTypeChart'
import {
  AllocationFilters,
  type Filters,
} from '../features/allocation/components/AllocationFilters'

const typeLabel: Record<string, string> = {
  LECTURE: 'Лекция',
  PRACTICE: 'Практика',
}

export function AllocationPage() {
  const { data: snapshot, isLoading, isError } = useAllocationSnapshot()
  const generate = useGenerateWorkloads()
  const run = useRunAllocation()
  const setOverride = useSetOverride()
  const resetManual = useResetManual()
  const updateWl = useUpdateWorkload()
  const deleteWl = useDeleteWorkload()

  const lastClipped = useAllocationStore((s) => s.lastClipped)
  const clearClipped = useAllocationStore((s) => s.clearClipped)
  const clippedMap = useMemo(
    () => new Map(lastClipped.map((c) => [c.workloadId, c])),
    [lastClipped]
  )

  const [filters, setFilters] = useState<Filters>({
    teacherId: 'all',
    disciplineId: 'all',
    type: 'all',
  })
  const [showCreateModal, setShowCreateModal] = useState(false)

  const handleDelete = (workloadId: string, disciplineName: string) => {
    const ok = confirm(
      `Удалить workload «${disciplineName}»?\nСвязанные назначения тоже удалятся.`
    )
    if (ok) {
      deleteWl.mutate(workloadId)
    }
  }

  const filteredAllocations = useMemo(() => {
    if (!snapshot) return []
    const workloadById = indexById(snapshot.workloads)

    return snapshot.allocations.filter((a) => {
      const w = workloadById[a.workloadId]
      if (!w) return false
      if (filters.teacherId !== 'all' && a.teacherId !== filters.teacherId)
        return false
      if (
        filters.disciplineId !== 'all' &&
        w.disciplineId !== filters.disciplineId
      )
        return false
      if (filters.type !== 'all' && w.type !== filters.type) return false
      return true
    })
  }, [snapshot, filters])

  const filteredUnassigned = useMemo(() => {
    if (!snapshot) return []
    return snapshot.unassigned.filter((w) => {
      if (
        filters.disciplineId !== 'all' &&
        w.disciplineId !== filters.disciplineId
      )
        return false
      if (filters.type !== 'all' && w.type !== filters.type) return false
      if (filters.teacherId !== 'all') return false
      return true
    })
  }, [snapshot, filters])

  if (isLoading) return <Spinner />
  if (isError)
    return (
      <div className="text-red-600">
        Ошибка загрузки. Убедитесь, что бэкенд запущен.
      </div>
    )
  if (!snapshot) return null

  const disciplineById = indexById(snapshot.disciplines)
  const groupById = indexById(snapshot.groups)
  const workloadById = indexById(snapshot.workloads)

  const hasManual = snapshot.allocations.some((a) => a.status === 'MANUAL')
  const needsGenerate = snapshot.workloads.length === 0

  return (
    <div className="space-y-6">
      <PageHeader
        title="Распределение нагрузки"
        subtitle="Управление нагрузкой и назначениями"
        actions={
          <>
            {lastClipped.length > 0 && (
              <Button variant="warning" onClick={clearClipped}>
                Сбросить пометки ({lastClipped.length})
              </Button>
            )}
            <Button
              variant="success"
              onClick={() => setShowCreateModal(true)}
            >
              + Нагрузка
            </Button>
            <Button
              variant="secondary"
              onClick={() => generate.mutate()}
              disabled={generate.isPending}
            >
              {generate.isPending ? 'Генерация...' : 'Перегенерировать'}
            </Button>
            <Button
              variant="primary"
              onClick={() => run.mutate()}
              disabled={run.isPending || needsGenerate}
            >
              {run.isPending ? 'Распределение...' : 'Распределить'}
            </Button>
            {hasManual && (
              <Button
                variant="warning"
                onClick={() => resetManual.mutate()}
                disabled={resetManual.isPending}
              >
                {resetManual.isPending ? 'Сброс...' : 'Сбросить ручные'}
              </Button>
            )}
          </>
        }
      />

      {lastClipped.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
          <b>{lastClipped.length}</b> нагрузок обрезаны при последней генерации
          расписания. Они подсвечены ниже.
        </div>
      )}

      {needsGenerate && (
        <div className="bg-white border rounded-lg p-8 text-center">
          <p className="text-gray-500 mb-4">
            Нагрузки ещё не сгенерированы. Нажмите «Перегенерировать».
          </p>
        </div>
      )}

      {!needsGenerate && (
        <>
          <div className="grid grid-cols-3 gap-4">
            <StatCard
              icon="✅"
              label="Назначено"
              value={snapshot.allocations.length}
              accent="green"
            />
            <StatCard
              icon="⚠️"
              label="Не распределено"
              value={snapshot.unassigned.length}
              accent={snapshot.unassigned.length > 0 ? 'red' : 'gray'}
            />
            <StatCard
              icon="📋"
              label="Всего нагрузок"
              value={snapshot.workloads.length}
              accent="blue"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
              <TeachersLoadChart
                teachers={snapshot.teachers}
                loadByTeacher={snapshot.loadByTeacher}
              />
            </div>
            <WorkloadTypeChart workloads={snapshot.workloads} />
          </div>

          <section>
            <h2 className="text-lg font-medium text-gray-800 mb-2">
              Загрузка преподавателей
            </h2>
            <Table headers={['Преподаватель', 'Пар', 'Часов (×1.5)']}>
              {snapshot.teachers.map((t) => {
                const pairs = snapshot.loadByTeacher[t.id] ?? 0
                return (
                  <tr key={t.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2 font-medium text-gray-800">
                      {t.fullName}
                    </td>
                    <td className="px-4 py-2">{pairs}</td>
                    <td className="px-4 py-2 text-gray-500">
                      {pairsToHours(pairs).toFixed(1)}
                    </td>
                  </tr>
                )
              })}
            </Table>
          </section>

          <section>
            <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
              <h2 className="text-lg font-medium text-gray-800">Назначения</h2>
              <AllocationFilters
                filters={filters}
                onChange={setFilters}
                teachers={snapshot.teachers}
                disciplines={snapshot.disciplines}
              />
            </div>

            <Table
              headers={[
                'Дисциплина',
                'Тип',
                'Группы',
                'Пар',
                'Преподаватель',
                '',
              ]}
            >
              {filteredAllocations.map((a) => {
                const w = workloadById[a.workloadId]
                if (!w) return null

                const discipline = disciplineById[w.disciplineId]
                const groupNames = w.groupIds
                  .map((id) => groupById[id]?.name)
                  .filter(Boolean)
                  .join(', ')

                const candidates = snapshot.teachers.filter((t) =>
                  snapshot.competencies.some(
                    (c) =>
                      c.teacherId === t.id &&
                      c.disciplineId === w.disciplineId
                  )
                )

                const clippedInfo = clippedMap.get(w.id)

                return (
                  <tr
                    key={a.id}
                    className={`hover:bg-gray-50 ${
                      clippedInfo ? 'bg-red-50' : ''
                    }`}
                  >
                    <td className="px-4 py-2 font-medium text-gray-800">
                      {discipline?.name}
                      {clippedInfo && (
                        <span
                          className="ml-2 text-xs text-red-600 cursor-help"
                          title={`В расписании создано ${clippedInfo.created} из ${clippedInfo.wanted} пар`}
                        >
                          ⚠️ обрезано
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-gray-600">
                      {typeLabel[w.type]}
                    </td>
                    <td className="px-4 py-2 text-gray-500">{groupNames}</td>
                    <td className="px-4 py-2">
                      <EditablePairsCell
                        value={w.pairs}
                        onSave={(newPairs) =>
                          updateWl.mutate({
                            id: w.id,
                            dto: { pairs: newPairs },
                          })
                        }
                        disabled={updateWl.isPending}
                      />
                    </td>
                    <td className="px-4 py-2">
                      <select
                        value={a.teacherId}
                        onChange={(e) =>
                          setOverride.mutate({
                            workloadId: a.workloadId,
                            teacherId: e.target.value,
                          })
                        }
                        className="border rounded px-2 py-1 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {candidates.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.fullName}
                          </option>
                        ))}
                      </select>
                      {a.status === 'MANUAL' && (
                        <span className="ml-2 text-xs text-amber-600">
                          вручную
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-right">
                      <button
                        onClick={() =>
                          handleDelete(w.id, discipline?.name ?? '')
                        }
                        className="text-gray-400 hover:text-red-600 transition"
                        title="Удалить workload"
                      >
                        🗑
                      </button>
                    </td>
                  </tr>
                )
              })}

              {filteredUnassigned.map((w) => {
                const discipline = disciplineById[w.disciplineId]
                const groupNames = w.groupIds
                  .map((id) => groupById[id]?.name)
                  .filter(Boolean)
                  .join(', ')

                const clippedInfo = clippedMap.get(w.id)

                return (
                  <tr
                    key={w.id}
                    className={`${clippedInfo ? 'bg-red-100' : 'bg-red-50'}`}
                  >
                    <td className="px-4 py-2 font-medium text-gray-800">
                      {discipline?.name}
                      {clippedInfo && (
                        <span className="ml-2 text-xs text-red-600">
                          ⚠️ обрезано
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-gray-600">
                      {typeLabel[w.type]}
                    </td>
                    <td className="px-4 py-2 text-gray-500">{groupNames}</td>
                    <td className="px-4 py-2">
                      <EditablePairsCell
                        value={w.pairs}
                        onSave={(newPairs) =>
                          updateWl.mutate({
                            id: w.id,
                            dto: { pairs: newPairs },
                          })
                        }
                        disabled={updateWl.isPending}
                      />
                    </td>
                    <td className="px-4 py-2 text-red-600 text-sm">
                      нет подходящего преподавателя
                    </td>
                    <td className="px-4 py-2 text-right">
                      <button
                        onClick={() =>
                          handleDelete(w.id, discipline?.name ?? '')
                        }
                        className="text-gray-400 hover:text-red-600 transition"
                        title="Удалить workload"
                      >
                        🗑
                      </button>
                    </td>
                  </tr>
                )
              })}

              {filteredAllocations.length === 0 &&
                filteredUnassigned.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-8 text-center text-gray-400 text-sm"
                    >
                      Нет назначений, соответствующих фильтрам
                    </td>
                  </tr>
                )}
            </Table>
          </section>
        </>
      )}

      {showCreateModal && (
        <WorkloadModal
          disciplines={snapshot.disciplines}
          groups={snapshot.groups}
          onClose={() => setShowCreateModal(false)}
        />
      )}
    </div>
  )
}