import { useEffect, useState } from 'react'
import { NavLink, Navigate, Route, Routes } from 'react-router-dom'
import { ApiError } from '../api/client'
import { Alert } from '../components/ui/Alert'
import { Button } from '../components/ui/Button'
import { Form } from '../components/ui/Form'
import { SelectField } from '../components/ui/SelectField'
import { TextField } from '../components/ui/TextField'
import { useAuth } from '../contexts/AuthContext'
import { AppLayout } from '../layouts/AppLayout'
import { useDocumentTitle } from '../hooks/useDocumentTitle'

const TABS = [{ to: '/settings/profile', label: 'Profile', end: true }]

function userToForm(user) {
  return {
    user_id: user?.username || '',
    user_name: user?.full_name || '',
    user_dob: user?.date_of_birth || '',
    user_pan: user?.pan || '',
    user_gender: user?.gender || '',
    user_password: '',
    user_email: user?.email || '',
  }
}

function ProfileTab() {
  const { user, updateProfile } = useAuth()
  const [form, setForm] = useState(() => userToForm(user))
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [success, setSuccess] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    setForm(userToForm(user))
  }, [user])

  function updateField(name, value) {
    setForm((current) => ({ ...current, [name]: value }))
  }

  function validate() {
    const next = {}
    if (!form.user_id.trim()) next.user_id = 'Enter a user ID.'
    if (!form.user_name.trim()) next.user_name = 'Enter a user name.'
    if (!form.user_dob) next.user_dob = 'Enter a date of birth.'
    if (!form.user_pan.trim()) next.user_pan = 'Enter a PAN.'
    if (!form.user_gender) next.user_gender = 'Select a gender.'
    if (form.user_password && form.user_password.length < 8) {
      next.user_password = 'Password must be at least 8 characters.'
    }
    if (!form.user_email.trim()) next.user_email = 'Enter an email.'
    return next
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const nextErrors = validate()
    setErrors(nextErrors)
    setFormError('')
    setSuccess('')
    if (Object.keys(nextErrors).length > 0) return

    const payload = {
      user_id: form.user_id.trim(),
      user_name: form.user_name.trim(),
      user_dob: form.user_dob,
      user_pan: form.user_pan.trim().toUpperCase(),
      user_gender: form.user_gender,
      user_email: form.user_email.trim(),
    }
    if (form.user_password) {
      payload.user_password = form.user_password
    }

    setSubmitting(true)
    try {
      await updateProfile(payload)
      setForm((current) => ({ ...current, user_password: '' }))
      setShowPassword(false)
      setSuccess('Profile saved.')
    } catch (error) {
      if (error instanceof ApiError) {
        setFormError(error.message || 'Could not save profile.')
      } else {
        setFormError('Could not save profile.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold tracking-tight">Profile</h2>
      <p className="mt-1 text-sm text-stone-600">
        Update your account details. Leave password blank to keep your current password.
      </p>

      <Form className="mt-6 grid gap-4 sm:grid-cols-2" noValidate onSubmit={handleSubmit}>
        {formError ? (
          <div className="sm:col-span-2">
            <Alert>{formError}</Alert>
          </div>
        ) : null}
        {success ? (
          <div className="sm:col-span-2 rounded-lg border border-teal-200 bg-teal-50 px-3 py-2 text-sm text-teal-900">
            {success}
          </div>
        ) : null}

        <TextField
          id="yora_profile_code"
          name="yora_profile_code"
          label="User ID"
          value={form.user_id}
          onChange={(event) => updateField('user_id', event.target.value)}
          error={errors.user_id}
          autoCapitalize="none"
          disableUsernameAutofill
        />
        <TextField
          id="yora_profile_name"
          name="yora_profile_name"
          label="User name"
          value={form.user_name}
          onChange={(event) => updateField('user_name', event.target.value)}
          error={errors.user_name}
        />
        <TextField
          id="yora_profile_dob"
          name="yora_profile_dob"
          label="Date of birth"
          type="date"
          value={form.user_dob}
          onChange={(event) => updateField('user_dob', event.target.value)}
          error={errors.user_dob}
        />
        <TextField
          id="yora_profile_pan"
          name="yora_profile_pan"
          label="PAN"
          value={form.user_pan}
          onChange={(event) => updateField('user_pan', event.target.value.toUpperCase())}
          error={errors.user_pan}
          autoCapitalize="characters"
          maxLength={10}
        />
        <SelectField
          id="yora_profile_gender"
          name="yora_profile_gender"
          label="Gender"
          value={form.user_gender}
          onChange={(event) => updateField('user_gender', event.target.value)}
          error={errors.user_gender}
        >
          <option value="">Select gender</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
          <option value="other">Other</option>
        </SelectField>
        <TextField
          id="yora_profile_mail"
          name="yora_profile_mail"
          label="Email"
          type="text"
          inputMode="email"
          value={form.user_email}
          onChange={(event) => updateField('user_email', event.target.value)}
          error={errors.user_email}
          autoCapitalize="none"
        />
        <div className="sm:col-span-2 space-y-2">
          <TextField
            id="yora_profile_secret"
            name="yora_profile_secret"
            label="Password (optional)"
            type={showPassword ? 'text' : 'password'}
            value={form.user_password}
            onChange={(event) => updateField('user_password', event.target.value)}
            error={errors.user_password}
          />
          <button
            type="button"
            className="text-sm font-medium text-teal-800 hover:text-teal-900"
            onClick={() => setShowPassword((current) => !current)}
            aria-pressed={showPassword}
          >
            {showPassword ? 'Hide password' : 'Show password'}
          </button>
        </div>
        <div className="sm:col-span-2">
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Saving…' : 'Save profile'}
          </Button>
        </div>
      </Form>
    </section>
  )
}

export function Settings() {
  useDocumentTitle('Settings')

  return (
    <AppLayout title="Settings">
      <div
        className="inline-flex max-w-full rounded-xl bg-stone-200/70 p-1 ring-1 ring-stone-300/80"
        role="tablist"
        aria-label="Settings"
      >
        {TABS.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.end}
            role="tab"
            className={({ isActive }) =>
              [
                'rounded-lg px-4 py-2 text-sm transition',
                isActive
                  ? 'bg-white font-semibold text-stone-900 shadow-sm ring-1 ring-stone-200'
                  : 'font-medium text-stone-600 hover:text-stone-900',
              ].join(' ')
            }
          >
            {tab.label}
          </NavLink>
        ))}
      </div>

      <Routes>
        <Route index element={<Navigate to="profile" replace />} />
        <Route path="profile" element={<ProfileTab />} />
        <Route path="*" element={<Navigate to="profile" replace />} />
      </Routes>
    </AppLayout>
  )
}
