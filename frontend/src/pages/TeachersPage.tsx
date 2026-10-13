import { useState } from 'react'
import { useTeachers, useUpdateTeacher, useDeleteTeacher } from '../features/teachers/hooks'
import { useDisciplines } from '../features/disciplines/hooks'
import { Table } from '../shared/ui/Table'
import { Spinner } from '../shared/ui/Spinner'
import { PageHeader } from '../shared/ui/PageHeader'
import { Button } from '../shared/ui/Button'
import { Badge } from '../shared/ui/Badge'
import { EditableTeacherName } from '../features/teachers/EditableTeacherName'
import { EditableMaxPairs } from '../features/teachers/EditableMaxPairs'
import { TeacherModal } from '../features/teachers/TeacherModal'
import { CompetenciesModal } from '../features/teachers/CompetenciesModal'
import type { TeacherWithDisciplines } from '../features/teachers/api'

export function TeachersPage() {
  const teachers = useTeachers()
  const disciplines = useDisciplines()
  const updateT = useUpdateTeacher()
  const deleteT = useDeleteTeacher()

  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingCompetencies, setEditingCompetencies] =
    useState<TeacherWithDisciplines | null>(null)

  const handleDelete = (id: string, name: string) => {
    if (
      confirm(
        `Удалить преподавателя «${name}»?\n\n` +
          'Связанные данные тоже удалятся:\n' +
          '— компетенции\n' +
          '— назначения'
      )
    ) {
      deleteT.mutate(id)
    }
  }

  if (teachers.isLoading || disciplines.isLoading) return <Spinner />
  if (teachers.isError || disciplines.isError)
    return <p className="text-red-600">Ошибка загрузки</p>

  return (
    <div className="space-y-5">
      <PageHeader
        title="Преподаватели"
        subtitle={`Всего в системе: ${teachers.data?.length ?? 0}`}
        actions={
          <Button variant="success" onClick={() => setShowCreateModal(true)}>
            + Добавить
          </Button>
        }
      />

      <Table headers={['ФИО', 'Компетенции', 'Макс. пар', 'Доступ', '']}>
        {teachers.data?.map((t) => (
          <tr key={t.id} className="hover:bg-gray-50/60 transition">
            <td className="px-4 py-3">
              <EditableTeacherName
                value={t.fullName}
                onSave={(fullName) =>
                  updateT.mutate({ id: t.id, patch: { fullName } })
                }
                disabled={updateT.isPending}
              />
            </td>
            <td className="px-4 py-3">
              <button
                onClick={() => setEditingCompetencies(t)}
                className="text-left hover:bg-gray-100 rounded-md px-1.5 py-1 w-full transition"
                title="Нажмите, чтобы изменить компетенции"
              >
                {t.disciplineNames.length === 0 ? (
                  <span className="text-xs text-gray-400 italic">
                    нет компетенций
                  </span>
                ) : (
                  <div className="flex flex-wrap gap-1">
                    {t.disciplineNames.map((name) => (
                      <Badge key={name} color="blue">
                        {name}
                      </Badge>
                    ))}
                  </div>
                )}
              </button>
            </td>
            <td className="px-4 py-3">
              <EditableMaxPairs
                value={t.maxPairs}
                onSave={(maxPairs) =>
                  updateT.mutate({ id: t.id, patch: { maxPairs } })
                }
                disabled={updateT.isPending}
              />
            </td>
            <td className="px-4 py-3">
              <div className="text-xs leading-tight">
                <div className="text-gray-700">{t.email ?? '—'}</div>
                <div className="text-gray-400 font-mono">
                  {t.initialPassword ?? '—'}
                </div>
              </div>
            </td>
            <td className="px-4 py-3 text-right">
              <button
                onClick={() => handleDelete(t.id, t.fullName)}
                className="text-xs text-gray-500 hover:text-red-600 border border-gray-200 hover:border-red-300 rounded px-2 py-1 transition"
              >
                Удалить
              </button>
            </td>
          </tr>
        ))}

        {teachers.data?.length === 0 && (
          <tr>
            <td
              colSpan={5}
              className="px-4 py-12 text-center text-gray-400 text-sm"
            >
              Нет преподавателей. Добавьте первого.
            </td>
          </tr>
        )}
      </Table>

      {showCreateModal && (
        <TeacherModal onClose={() => setShowCreateModal(false)} />
      )}

      {editingCompetencies && (
        <CompetenciesModal
          teacher={editingCompetencies}
          disciplines={disciplines.data ?? []}
          onClose={() => setEditingCompetencies(null)}
        />
      )}
    </div>
  )
}