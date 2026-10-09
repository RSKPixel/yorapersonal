export function Button({ children, variant = 'primary', className = '', ...props }) {
  const variants = {
    primary: 'bg-teal-800 text-white hover:bg-teal-900',
    secondary: 'bg-white text-stone-800 ring-1 ring-stone-300 hover:bg-stone-50',
    ghost: 'bg-transparent text-stone-200 hover:bg-white/10',
  }

  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 disabled:cursor-not-allowed disabled:opacity-60 ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
