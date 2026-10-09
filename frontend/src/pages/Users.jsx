import { useEffect, useState } from 'react'
import * as usersApi from '../api/users'
import { ApiError } from '../api/client'
import { Alert } from '../components/ui/Alert'
import { Button } from '../components/ui/Button'
import { Form } from '../components/ui/Form'
import { SelectField } from '../components/ui/SelectField'
import { TextField } from '../components/ui/TextField'
import { AppLayout } from '../layouts/AppLayout'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { formatDateTime } from '../utils/format'

const EMPTY_FORM = {
  user_id: '',
  user_name: '',
  user_dob: '',
  user_pan: '',
  user_gender: '',
  user_password: '',
  user_email: '',
}

function userToForm(user) {
  return {
    user_id: user.username || '',
    user_name: user.full_name || '',
    user_dob: user.date_of_birth || '',
    user_pan: user.pan || '',
    user_gender: user.gender || '',
    user_password: '',
    user_email: user.email || '',
  }
}

export function Users() {
  useDocumentTitle('Users')
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [success, setSuccess] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const isEditing = editingId !== null

  async function loadUsers() {
    setLoadError('')
    setLoading(true)
    try {
      setUsers(await usersApi.listUsers())
    } catch (error) {
      setLoadError(error.message || 'Could not load users.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadUsers()
  }, [])

  // Chrome maps "User ID" to username autofill; clear it when creating a new user.
  useEffect(() => {
    if (isEditing) return undefined
    const timer = window.setTimeout(() => {
      setForm((current) => ({ ...current, user_id: '', user_password: '' }))
    }, 50)
    return () => window.clearTimeout(timer)
  }, [isEditing])

  function resetForm() {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setErrors({})
    setFormError('')
    setShowPassword(false)
  }

  function startEdit(user) {
    setEditingId(user.id)
    setForm(userToForm(user))
    setErrors({})
    setFormError('')
    setSuccess('')
    setShowPassword(false)
  }

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
    if (!isEditing && !form.user_password) next.user_password = 'Enter a password.'
    else if (form.user_password && form.user_password.length < 8) {
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
      if (isEditing) {
        const updated = await usersApi.updateUser(editingId, payload)
        setSuccess(`Updated user ${updated.username}.`)
      } else {
        payload.user_password = form.user_password
        const created = await usersApi.createUser(payload)
        setSuccess(`Created user ${created.username}.`)
      }
      resetForm()
      await loadUsers()
    } catch (error) {
      if (error instanceof ApiError) {
        setFormError(error.message || (isEditing ? 'Could not update user.' : 'Could not create user.'))
      } else {
        setFormError(isEditing ? 'Could not update user.' : 'Could not create user.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AppLayout title="Users">
      <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold tracking-tight">{isEditing ? 'Edit user' : 'Create user'}</h2>
        <p className="mt-1 text-sm text-stone-600">
          {isEditing
            ? 'Update account details. Leave password blank to keep the current password.'
            : 'Only administrators can add or edit accounts.'}
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
            id="yora_acct_code"
            name="yora_acct_code"
            label="User ID"
            value={form.user_id}
            onChange={(event) => updateField('user_id', event.target.value)}
            error={errors.user_id}
            autoCapitalize="none"
            disableUsernameAutofill
          />
          <TextField
            id="yora_user_name"
            name="yora_user_name"
            label="User name"
            value={form.user_name}
            onChange={(event) => updateField('user_name', event.target.value)}
            error={errors.user_name}
          />
          <TextField
            id="yora_user_dob"
            name="yora_user_dob"
            label="Date of birth"
            type="date"
            value={form.user_dob}
            onChange={(event) => updateField('user_dob', event.target.value)}
            error={errors.user_dob}
          />
          <TextField
            id="yora_user_pan"
            name="yora_user_pan"
            label="PAN"
            value={form.user_pan}
            onChange={(event) => updateField('user_pan', event.target.value.toUpperCase())}
            error={errors.user_pan}
            autoCapitalize="characters"
            maxLength={10}
          />
          <SelectField
            id="yora_user_gender"
            name="yora_user_gender"
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
            id="yora_user_email"
            name="yora_user_email"
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
              id="yora_user_secret"
              name="yora_user_secret"
              label={isEditing ? 'Password (optional)' : 'Password'}
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
          <div className="sm:col-span-2 flex flex-wrap gap-3">
            <Button type="submit" disabled={submitting}>
              {submitting ? (isEditing ? 'Saving…' : 'Creating…') : isEditing ? 'Save changes' : 'Create user'}
            </Button>
            {isEditing ? (
              <Button type="button" variant="secondary" onClick={resetForm} disabled={submitting}>
                Cancel
              </Button>
            ) : null}
          </div>
        </Form>
      </section>

      <section className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
        <div className="border-b border-stone-200 px-6 py-4">
          <h2 className="text-base font-semibold">All users</h2>
        </div>
        {loadError ? (
          <div className="p-6">
            <Alert>{loadError}</Alert>
          </div>
        ) : null}
        {loading ? (
          <p className="px-6 py-8 text-sm text-stone-600">Loading users…</p>
        ) : users.length === 0 ? (
          <p className="px-6 py-8 text-sm text-stone-600">No users yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-stone-200 bg-stone-50 text-stone-500">
                <tr>
                  <th className="px-6 py-3 font-medium">User ID</th>
                  <th className="px-6 py-3 font-medium">Name</th>
                  <th className="px-6 py-3 font-medium">Email</th>
                  <th className="px-6 py-3 font-medium">PAN</th>
                  <th className="px-6 py-3 font-medium">Gender</th>
                  <th className="px-6 py-3 font-medium">DOB</th>
                  <th className="px-6 py-3 font-medium">Role</th>
                  <th className="px-6 py-3 font-medium">Created</th>
                  <th className="px-6 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200">
                {users.map((user) => (
                  <tr key={user.id} className={editingId === user.id ? 'bg-teal-50/40' : undefined}>
                    <td className="px-6 py-3 font-medium text-stone-900">{user.username}</td>
                    <td className="px-6 py-3 text-stone-700">{user.full_name}</td>
                    <td className="px-6 py-3 text-stone-700">{user.email || '—'}</td>
                    <td className="px-6 py-3 text-stone-700">{user.pan || '—'}</td>
                    <td className="px-6 py-3 capitalize text-stone-700">{user.gender || '—'}</td>
                    <td className="px-6 py-3 text-stone-700">{user.date_of_birth || '—'}</td>
                    <td className="px-6 py-3 text-stone-700">{user.is_admin ? 'Admin' : 'Member'}</td>
                    <td className="px-6 py-3 text-stone-700">{formatDateTime(user.created_at)}</td>
                    <td className="px-6 py-3">
                      <button
                        type="button"
                        className="text-sm font-medium text-teal-800 hover:text-teal-900"
                        onClick={() => startEdit(user)}
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </AppLayout>
  )
}
