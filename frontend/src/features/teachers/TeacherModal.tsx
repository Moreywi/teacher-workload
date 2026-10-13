import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useCreateTeacher } from './hooks'
import type { CreateTeacherResponse } from './api'

const schema = z.object({
  fullName: z
    .string()
    .trim()
    .min(1, 'ФИО обязательно')
    .max(150, 'Максимум 150 символов'),
  maxPairs: z.union([z.number().int().positive(), z.nan()]).optional(),
})

type FormData = z.infer<typeof schema>

interface Props {
  onClose: () => void
}

export function TeacherModal({ onClose }: Props) {
  const create = useCreateTeacher()
  const [created, setCreated] = useState<CreateTeacherResponse | null>(null)
  const [copied, setCopied] = useState<'email' | 'password' | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { fullName: '', maxPairs: undefined },
  })

  const onSubmit = async (data: FormData) => {
    const maxPairs =
      typeof data.maxPairs === 'number' && !isNaN(data.maxPairs)
        ? data.maxPairs
        : null

    try {
      const result = await create.mutateAsync({
        fullName: data.fullName,
        maxPairs,
      })
      setCreated(result)
    } catch (e: any) {
      alert(e.response?.data?.error ?? 'Ошибка создания')
    }
  }

  const copy = (value: string, field: 'email' | 'password') => {
    navigator.clipboard.writeText(value)
    setCopied(field)
    setTimeout(() => setCopied(null), 1500)
  }

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-lg w-full max-w-sm p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {created ? (
          <>
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              Преподаватель создан
            </h2>

            <p className="text-sm text-gray-600 mb-3">
              Сохраните данные для входа. Пароль показывается один раз.
            </p>

            <div className="rounded border border-gray-200 bg-gray-50 p-3 space-y-3">
              <div>
                <div className="text-xs text-gray-500 mb-1">Email</div>
                <div className="flex items-center justify-between gap-2">
                  <code className="text-sm text-gray-800 truncate">
                    {created.email}
                  </code>
                  <button
                    type="button"
                    onClick={() => copy(created.email, 'email')}
                    className="text-xs text-blue-600 hover:text-blue-800 shrink-0"
                  >
                    {copied === 'email' ? '✓' : 'Копировать'}
                  </button>
                </div>
              </div>

              <div>
                <div className="text-xs text-gray-500 mb-1">Пароль</div>
                <div className="flex items-center justify-between gap-2">
                  <code className="text-sm text-gray-800">
                    {created.initialPassword}
                  </code>
                  <button
                    type="button"
                    onClick={() => copy(created.initialPassword, 'password')}
                    className="text-xs text-blue-600 hover:text-blue-800 shrink-0"
                  >
                    {copied === 'password' ? '✓' : 'Копировать'}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded"
              >
                Готово
              </button>
            </div>
          </>
        ) : (
          <>
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              Новый преподаватель
            </h2>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-700 mb-1">ФИО</label>
                <input
                  type="text"
                  autoFocus
                  {...register('fullName')}
                  maxLength={150}
                  placeholder="Иванов Иван Иванович"
                  className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {errors.fullName && (
                  <p className="text-xs text-red-600 mt-1">
                    {errors.fullName.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-1">
                  Максимум пар (необязательно)
                </label>
                <input
                  type="number"
                  min={1}
                  {...register('maxPairs', { valueAsNumber: true })}
                  placeholder="оставьте пустым, если без лимита"
                  className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Если задать — алгоритм не превысит этот лимит при распределении
                </p>
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
          </>
        )}
      </div>
    </div>
  )
}