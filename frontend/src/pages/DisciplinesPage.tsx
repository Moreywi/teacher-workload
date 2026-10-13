import { useState } from 'react'
import {
  useDisciplines,
  useUpdateDiscipline,
  useDeleteDiscipline,
} from '../features/disciplines/hooks'
import { useTeachers } from '../features/teachers/hooks'
import { Table } from '../shared/ui/Table'
import { Spinner } from '../shared/ui/Spinner'
import { PageHeader } from '../shared/ui/PageHeader'
import { Button } from '../shared/ui/Button'
import { Badge } from '../shared/ui/Badge'
import { EditableDisciplineName } from '../features/disciplines/EditableDisciplineName'
import { DisciplineModal } from '../features/disciplines/DisciplineModal'

export function DisciplinesPage() {
  const disciplines = useDisciplines()
  const teachers = useTeachers()
  const updateD = useUpdateDiscipline()
  const deleteD = useDeleteDiscipline()

  const [showCreateModal, setShowCreateModal] = useState(false)

  const handleDelete = (id: string, name: string) => {
    if (
      confirm(
        `Удалить дисциплину «${name}»?\n\n` +
          'Связанные данные тоже удалятся:\n' +
          '— компетенции\n' +
          '— workload\'ы\n' +
          '— назначения'
      )
    ) {
      deleteD.mutate(id)
    }
  }

  if (disciplines.isLoading || teachers.isLoading) return <Spinner />
  if (disciplines.isError || teachers.isError)
    return <p className="text-red-600">Ошибка загрузки</p>

  return (
    <div className="space-y-5">
      <PageHeader
        title="Дисциплины"
        subtitle={`Всего в системе: ${disciplines.data?.length ?? 0}`}
        actions={
          <Button
            variant="success"
            onClick={() => setShowCreateModal(true)}
          >
            + Добавить
          </Button>
        }
      />

      <Table headers={['Дисциплина', 'Кто может вести', '']}>
        {disciplines.data?.map((d) => {
          const canTeach =
            teachers.data?.filter((t) => t.disciplineIds.includes(d.id)) ?? []

          return (
            <tr key={d.id} className="hover:bg-gray-50/60 transition">
              <td className="px-4 py-3 font-medium text-gray-800">
                <EditableDisciplineName
                  value={d.name}
                  onSave={(newName) =>
                    updateD.mutate({ id: d.id, name: newName })
                  }
                  disabled={updateD.isPending}
                />
              </td>
              <td className="px-4 py-3">
                {canTeach.length === 0 ? (
                  <Badge color="red">нет компетентных</Badge>
                ) : (
                  <div className="flex flex-wrap gap-1">
                    {canTeach.map((t) => (
                      <Badge key={t.id} color="green">
                        {t.fullName}
                      </Badge>
                    ))}
                  </div>
                )}
              </td>
              <td className="px-4 py-3 text-right">
                <button
                  onClick={() => handleDelete(d.id, d.name)}
                  className="text-gray-300 hover:text-red-600 transition text-lg leading-none"
                  title="Удалить"
                >
                  🗑
                </button>
              </td>
            </tr>
          )
        })}

        {disciplines.data?.length === 0 && (
          <tr>
            <td
              colSpan={3}
              className="px-4 py-12 text-center text-gray-400 text-sm"
            >
              Нет дисциплин
            </td>
          </tr>
        )}
      </Table>

      {showCreateModal && (
        <DisciplineModal onClose={() => setShowCreateModal(false)} />
      )}
    </div>
  )
}