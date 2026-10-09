/** Attributes that discourage browser and password-manager autofill. */
export const AUTOFILL_OFF = {
  autoComplete: 'new-password',
  autoCorrect: 'off',
  spellCheck: false,
  'data-1p-ignore': 'true',
  'data-lpignore': 'true',
  'data-bwignore': 'true',
  'data-form-type': 'other',
}

/**
 * Stronger token for fields Chrome maps as username / User ID.
 * Avoid name/id values containing user, id, login, email, or account.
 */
export const USERNAME_AUTOFILL_OFF = {
  ...AUTOFILL_OFF,
  autoComplete: 'one-time-code',
}
