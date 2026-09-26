import { Link } from 'react-router'

export default function NotFoundPage({ embedded = false }) {
  return (
    <div className={`grid place-items-center px-4 text-center ${embedded ? 'py-24' : 'min-h-screen'}`}>
      <div>
        <p className="text-sm font-semibold text-accent-700">404</p>
        <h1 className="mt-1 text-2xl font-bold">Page not found</h1>
        <Link to={embedded ? '/admin' : '/'} className="mt-4 inline-flex min-h-11 items-center text-sm font-medium text-brand-700 hover:underline">
          {embedded ? 'Go to the dashboard' : 'Go to project listing'}
        </Link>
      </div>
    </div>
  )
}
