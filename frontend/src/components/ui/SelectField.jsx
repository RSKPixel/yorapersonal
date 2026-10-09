import { AUTOFILL_OFF } from '../../utils/autofill'

export function SelectField({
  id,
  label,
  error,
  children,
  name,
  autoComplete: _autoComplete,
  ...props
}) {
  const describedBy = error ? `${id}-error` : undefined
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium text-stone-800">
        {label}
      </label>
      <select
        {...props}
        {...AUTOFILL_OFF}
        id={id}
        name={name ?? id}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={describedBy}
        className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-sm text-stone-900 shadow-sm outline-none transition focus:border-teal-700 focus:ring-2 focus:ring-teal-700/20"
      >
        {children}
      </select>
      {error ? (
        <p id={describedBy} className="text-sm text-red-700">
          {error}
        </p>
      ) : null}
    </div>
  )
}
