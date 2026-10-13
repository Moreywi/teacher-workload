import { useState } from 'react'
import { PageHeader } from '../shared/ui/PageHeader'
import { Button } from '../shared/ui/Button'
import { changePassword } from '../features/me/api'

export function ChangePasswordPage() {
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    if (newPassword.length < 6) {
      setError('Пароль минимум 6 символов')
      return
    }
    if (newPassword !== confirm) {
      setError('Пароли не совпадают')
      return
    }

    setLoading(true)
    try {
      await changePassword(oldPassword, newPassword)
      setSuccess(true)
      setOldPassword('')
      setNewPassword('')
      setConfirm('')
    } catch (e: any) {
      setError(e.response?.data?.error ?? 'Не удалось сменить пароль')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader title="Смена пароля" />

      <form
        onSubmit={onSubmit}
        className="bg-white border border-gray-200 rounded-lg p-6 max-w-md space-y-4"
      >
        <div>
          <label className="block text-sm text-gray-700 mb-1">
            Текущий пароль
          </label>
          <input
            type="password"
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
            required
            className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-700 mb-1">
            Новый пароль
          </label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-700 mb-1">
            Повторите новый пароль
          </label>
          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {error && <div className="text-sm text-red-600">{error}</div>}
        {success && <div className="text-sm text-green-600">Пароль изменён</div>}

        <div className="flex justify-end">
          <Button type="submit" disabled={loading}>
            {loading ? 'Сохраняем...' : 'Сменить пароль'}
          </Button>
        </div>
      </form>
    </div>
  )
}