import { Link } from 'react-router-dom'
import { useDocumentTitle } from '../hooks/useDocumentTitle'

export function NotFound() {
  useDocumentTitle('Page not found')

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-stone-100 px-6 text-center">
      <p className="text-sm font-semibold tracking-[0.18em] text-teal-800 uppercase">404</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight text-stone-900">Page not found</h1>
      <p className="mt-2 max-w-md text-sm text-stone-600">That address is not part of this application.</p>
      <Link
        to="/"
        className="mt-6 rounded-lg bg-teal-800 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-900"
      >
        Go to home
      </Link>
    </div>
  )
}
