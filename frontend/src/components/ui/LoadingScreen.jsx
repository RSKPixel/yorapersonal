export function LoadingScreen({ label = 'Checking your session' }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-stone-100 px-6" role="status">
      <div className="flex items-center gap-3 text-sm text-stone-600">
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-stone-300 border-t-teal-800" />
        {label}
      </div>
    </div>
  )
}
