import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { api } from '../shared/api/client'
import { useAuthStore, type AuthUser } from '../stores/authStore'
import { useQueryClient } from '@tanstack/react-query'

const schema = z.object({
  email: z.string().email('Некорректный email'),
  password: z.string().min(4, 'Минимум 4 символа'),
})

type FormData = z.infer<typeof schema>

interface LoginResponse {
  token: string
  user: AuthUser
}

export function LoginPage() {
  const login = useAuthStore((s) => s.login)
  const navigate = useNavigate()
  const [serverError, setServerError] = useState<string | null>(null)
  const queryClient = useQueryClient()
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const onSubmit = async (data: FormData) => {
    setServerError(null)
    try {
      const { data: response } = await api.post<LoginResponse>('/auth/login', data)
      login(response.user, response.token)
      queryClient.clear()
      navigate(response.user.role === 'STAFF' ? '/my-load' : '/')
    } catch (e: any) {
      const message =
        e.response?.data?.error ?? 'Ошибка входа. Попробуйте ещё раз'
      setServerError(message)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="bg-white p-8 rounded-lg shadow-sm w-full max-w-sm space-y-4"
      >
        <h1 className="text-xl font-semibold text-gray-800">Вход</h1>

        <div>
          <label className="block text-sm text-gray-700 mb-1">Email</label>
          <input
            {...register('email')}
            type="email"
            autoComplete="email"
            className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="admin@example.com"
          />
          {errors.email && (
            <p className="text-xs text-red-600 mt-1">{errors.email.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm text-gray-700 mb-1">Пароль</label>
          <input
            {...register('password')}
            type="password"
            autoComplete="current-password"
            className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.password && (
            <p className="text-xs text-red-600 mt-1">
              {errors.password.message}
            </p>
          )}
        </div>

        {serverError && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">
            {serverError}
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-blue-600 text-white rounded-md py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {isSubmitting ? 'Вход…' : 'Войти'}
        </button>

        <div className="text-xs text-gray-400 text-center space-y-1">
          <p>Dev-доступы:</p>
          <p>admin@example.com / admin123 — админ</p>
          <p>orlov@example.com / teacher123 — преподаватель</p>
        </div>
      </form>
    </div>
  )
}