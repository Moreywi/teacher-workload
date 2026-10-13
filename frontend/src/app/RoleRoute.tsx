import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore, type Role } from '../stores/authStore'

interface Props {
  roles: Role[]
}

export function RoleRoute({ roles }: Props) {
  const user = useAuthStore((s) => s.user)

  if (!user) return <Navigate to="/login" replace />
  if (!roles.includes(user.role)) return <Navigate to="/" replace />

  return <Outlet />
}