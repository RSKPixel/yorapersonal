import { useState } from 'react'
import { AUTOFILL_OFF, USERNAME_AUTOFILL_OFF } from '../../utils/autofill'

export function TextField({
  id,
  label,
  error,
  name,
  autoComplete: _autoComplete,
  readOnly,
  onFocus,
  autoCapitalize = 'off',
  disableUsernameAutofill = false,
  ...props
}) {
  const [locked, setLocked] = useState(true)
  const describedBy = error ? `${id}-error` : undefined
  const autofillProps = disableUsernameAutofill ? USERNAME_AUTOFILL_OFF : AUTOFILL_OFF

  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium text-stone-800">
        {label}
      </label>
      <input
        {...props}
        {...autofillProps}
        id={id}
        name={name ?? id}
        autoCapitalize={autoCapitalize}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={describedBy}
        readOnly={readOnly || locked}
        onFocus={(event) => {
          setLocked(false)
          onFocus?.(event)
        }}
        className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-sm text-stone-900 shadow-sm outline-none transition placeholder:text-stone-400 focus:border-teal-700 focus:ring-2 focus:ring-teal-700/20 read-only:bg-white"
      />
      {error ? (
        <p id={describedBy} className="text-sm text-red-700">
          {error}
        </p>
      ) : null}
    </div>
  )
}
