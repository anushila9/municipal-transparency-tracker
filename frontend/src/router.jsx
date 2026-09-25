import { createBrowserRouter } from 'react-router'
import PublicLayout from './layouts/PublicLayout.jsx'
import AdminLayout from './layouts/AdminLayout.jsx'
import RequireAdmin from './components/RequireAdmin.jsx'
import ProjectListPage from './pages/public/ProjectListPage.jsx'
import ProjectDetailPage from './pages/public/ProjectDetailPage.jsx'
import AdminLoginPage from './pages/admin/AdminLoginPage.jsx'
import AdminDashboardPage from './pages/admin/AdminDashboardPage.jsx'
import NotFoundPage from './pages/NotFoundPage.jsx'

export const router = createBrowserRouter([
  // Citizen-facing: no login required.
  {
    element: <PublicLayout />,
    children: [
      { index: true, element: <ProjectListPage /> },
      { path: 'projects/:id', element: <ProjectDetailPage /> },
    ],
  },
  // Admin panel: everything except the login page requires a token.
  { path: 'admin/login', element: <AdminLoginPage /> },
  {
    path: 'admin',
    element: (
      <RequireAdmin>
        <AdminLayout />
      </RequireAdmin>
    ),
    children: [{ index: true, element: <AdminDashboardPage /> }],
  },
  { path: '*', element: <NotFoundPage /> },
])
