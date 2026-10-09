/**
 * Form wrapper that keeps autocomplete off.
 * Hidden decoy fields absorb Chrome/password-manager autofill so real fields stay empty.
 */
export function Form({ children, className = '', ...props }) {
  return (
    <form {...props} autoComplete="off" className={`relative ${className}`.trim()}>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-0 top-0 -z-10 h-px w-px overflow-hidden opacity-[0.01]"
      >
        <label>
          Username
          <input type="text" name="username" tabIndex={-1} autoComplete="username" defaultValue="" />
        </label>
        <label>
          Password
          <input
            type="password"
            name="password"
            tabIndex={-1}
            autoComplete="current-password"
            defaultValue=""
          />
        </label>
        <label>
          Email
          <input type="text" name="email" tabIndex={-1} autoComplete="email" defaultValue="" />
        </label>
      </div>
      {children}
    </form>
  )
}
