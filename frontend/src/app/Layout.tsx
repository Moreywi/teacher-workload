import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import clsx from 'clsx'
import { useAuthStore } from '../stores/authStore'
import { useQueryClient } from '@tanstack/react-query'

const navItems = [
  { to: '/', label: 'Дашборд', roles: ['ADMIN', 'STAFF'] },
  { to: '/my-load', label: 'Моя нагрузка', roles: ['STAFF'] },
  { to: '/teachers', label: 'Преподаватели', roles: ['ADMIN'] },
  { to: '/disciplines', label: 'Дисциплины', roles: ['ADMIN'] },
  { to: '/allocation', label: 'Распределение', roles: ['ADMIN'] },
  { to: '/schedule', label: 'Расписание', roles: ['ADMIN', 'STAFF'] },
]

export function Layout() {
  const logout = useAuthStore((s) => s.logout)
  const user = useAuthStore((s) => s.user)
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const handleLogout = () => {
    logout()
    queryClient.clear()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold">
                Н
              </div>
              <span className="font-semibold text-gray-900 hidden sm:inline">
                Распределение нагрузки
              </span>
            </div>

            <nav className="flex gap-1">
              {navItems
                .filter((item) => user && item.roles.includes(user.role))
                .map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === '/'}
                    className={({ isActive }) =>
                      clsx(
                        'px-3 py-2 text-sm rounded-lg transition',
                        isActive
                          ? 'bg-blue-50 text-blue-700 font-medium'
                          : 'text-gray-600 hover:bg-gray-100'
                      )
                    }
                  >
                    {item.label}
                  </NavLink>
                ))}
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <div className="text-sm text-gray-700 leading-tight">
                {user?.email}
              </div>
              <div className="text-xs text-gray-400 leading-tight">
                {user?.role === 'ADMIN' ? 'Администратор' : 'Преподаватель'}
              </div>
            </div>
            <button
              onClick={() => navigate('/change-password')}
              className="text-sm text-gray-500 hover:text-blue-600 transition px-3 py-1.5 rounded-lg hover:bg-blue-50"
            >
              Сменить пароль
            </button>
            <button
              onClick={handleLogout}
              className="text-sm text-gray-500 hover:text-red-600 transition px-3 py-1.5 rounded-lg hover:bg-red-50"
            >
              Выйти
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <Outlet />
      </main>
    </div>
  )
}