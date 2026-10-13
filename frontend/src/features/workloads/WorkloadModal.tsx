import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { Discipline, Group } from '../../shared/types'
import { useCreateWorkload } from './hooks'

const schema = z.object({
  disciplineId: z.string().min(1, 'Выберите дисциплину'),
  type: z.enum(['LECTURE', 'PRACTICE']),
  pairs: z.number().int().positive('Должно быть положительное число'),
  groupIds: z.array(z.string()).min(1, 'Выберите хотя бы одну группу'),
})

type FormData = z.infer<typeof schema>

interface Props {
  disciplines: Discipline[]
  groups: Group[]
  onClose: () => void
}

export function WorkloadModal({ disciplines, groups, onClose }: Props) {
  const create = useCreateWorkload()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      type: 'LECTURE',
      pairs: 18,
      groupIds: [],
    },
  })

  const onSubmit = async (data: FormData) => {
    try {
      await create.mutateAsync(data)
      onClose()
    } catch (e: any) {
      alert(e.response?.data?.error ?? 'Ошибка создания')
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-lg w-full max-w-md p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          Новый workload
        </h2>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-700 mb-1">
              Дисциплина
            </label>
            <select
              {...register('disciplineId')}
              className="w-full border rounded px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">— выберите —</option>
              {disciplines.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
            {errors.disciplineId && (
              <p className="text-xs text-red-600 mt-1">
                {errors.disciplineId.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-1">Тип</label>
            <select
              {...register('type')}
              className="w-full border rounded px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="LECTURE">Лекция</option>
              <option value="PRACTICE">Практика</option>
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-1">
              Количество пар
            </label>
            <input
              type="number"
              min={1}
              {...register('pairs', { valueAsNumber: true })}
              className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.pairs && (
              <p className="text-xs text-red-600 mt-1">
                {errors.pairs.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-1">Группы</label>
            <div className="space-y-1">
              {groups.map((g) => (
                <label
                  key={g.id}
                  className="flex items-center gap-2 text-sm text-gray-700"
                >
                  <input
                    type="checkbox"
                    value={g.id}
                    {...register('groupIds')}
                    className="rounded border-gray-300"
                  />
                  {g.name}
                </label>
              ))}
            </div>
            {errors.groupIds && (
              <p className="text-xs text-red-600 mt-1">
                {errors.groupIds.message}
              </p>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded disabled:opacity-50"
            >
              {isSubmitting ? 'Создание...' : 'Создать'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}