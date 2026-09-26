import { createBrowserRouter } from 'react-router'
import PublicLayout from './layouts/PublicLayout.jsx'
import AdminLayout from './layouts/AdminLayout.jsx'
import RequireAdmin from './components/RequireAdmin.jsx'
import ProjectListPage from './pages/public/ProjectListPage.jsx'
import ProjectDetailPage from './pages/public/ProjectDetailPage.jsx'
import AdminLoginPage from './pages/admin/AdminLoginPage.jsx'
import NotFoundPage from './pages/NotFoundPage.jsx'
import Spinner from './components/ui/Spinner.jsx'

// Admin pages (and Recharts) load on demand, so citizens on phones never download them.
const page = (load) => async () => ({ Component: (await load()).default })

function PageLoading() {
  return (
    <div className="grid min-h-[50vh] place-items-center text-brand-700">
      <Spinner className="h-7 w-7" label="Loading" />
    </div>
  )
}

export const router = createBrowserRouter([
  // Citizen-facing: no login required.
  {
    element: <PublicLayout />,
    children: [
      { index: true, element: <ProjectListPage /> },
      { path: 'projects/:id', element: <ProjectDetailPage /> },
    ],
  },
  // Admin panel: everything except the login page requires a valid token.
  { path: 'admin/login', element: <AdminLoginPage /> },
  {
    path: 'admin',
    hydrateFallbackElement: <PageLoading />,
    element: (
      <RequireAdmin>
        <AdminLayout />
      </RequireAdmin>
    ),
    children: [
      { index: true, lazy: page(() => import('./pages/admin/AdminDashboardPage.jsx')) },
      { path: 'projects', lazy: page(() => import('./pages/admin/AdminProjectsPage.jsx')) },
      { path: 'projects/new', lazy: page(() => import('./pages/admin/AdminProjectFormPage.jsx')) },
      { path: 'projects/:id', lazy: page(() => import('./pages/admin/AdminProjectFormPage.jsx')) },
      { path: 'reports', lazy: page(() => import('./pages/admin/AdminReportsPage.jsx')) },
      { path: 'audit', lazy: page(() => import('./pages/admin/AdminAuditPage.jsx')) },
      { path: '*', element: <NotFoundPage embedded /> },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
])
