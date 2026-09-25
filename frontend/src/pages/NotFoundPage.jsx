import { Link } from 'react-router'

export default function NotFoundPage() {
  return (
    <div className="grid min-h-screen place-items-center px-4 text-center">
      <div>
        <p className="text-sm font-semibold text-brand-700">404</p>
        <h1 className="mt-1 text-2xl font-bold">Page not found</h1>
        <Link to="/" className="mt-4 inline-block text-sm font-medium text-brand-700 hover:underline">
          Go to project listing
        </Link>
      </div>
    </div>
  )
}
