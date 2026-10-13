import { createBrowserRouter, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { Layout } from './Layout';
import { LoginPage } from '../pages/LoginPage';
import { DashboardPage } from '../pages/DashboardPage';
import { TeachersPage } from '../pages/TeachersPage';
import { DisciplinesPage } from '../pages/DisciplinesPage';
import { AllocationPage } from '../pages/AllocationPage';
import { RoleRoute } from './RoleRoute';
import { MyLoadPage } from '../pages/MyLoadPage';
import { SchedulePage } from '../pages/SchedulePage';
import { ChangePasswordPage } from '../pages/ChangePasswordPage';

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <Layout />,
        children: [
          {
            index: true,
            element: <DashboardPage />,
          },
          {
            path: 'change-password',
            element: <ChangePasswordPage />,
          },
          {
            element: <RoleRoute roles={['ADMIN', 'STAFF']} />,
            children: [
              { path: 'schedule', element: <SchedulePage /> },
            ],
          },
          {
            element: <RoleRoute roles={['STAFF']} />,
            children: [
              { path: 'my-load', element: <MyLoadPage /> },
            ],
          },
          {
            element: <RoleRoute roles={['ADMIN']} />,
            children: [
              {
                path: 'teachers',
                element: <TeachersPage />,
              },
              {
                path: 'disciplines',
                element: <DisciplinesPage />,
              },
              {
                path: 'allocation',
                element: <AllocationPage />,
              },
            ],
          },
        ],
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);