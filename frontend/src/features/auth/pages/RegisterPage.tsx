import { useForm } from '@tanstack/react-form'
import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'

import { handleApiError } from '../../../shared/api/handleApiError'
import { FormError } from '../../../shared/components/FormError'
import { Button } from '../../../shared/ui/Button'
import { Card } from '../../../shared/ui/Card'
import { Input } from '../../../shared/ui/Input'
import { fieldError } from '../../../shared/utils/fieldError'
import { useAuthStore } from '../../../store/authStore'
import { registerRequest } from '../api/auth'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function RegisterPage() {
  const usuario = useAuthStore((s) => s.usuario)
  const login = useAuthStore((s) => s.login)
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)

  const form = useForm({
    defaultValues: { username: '', full_name: '', email: '', password: '', confirmar: '' },
    onSubmit: async ({ value }) => {
      setError(null)
      try {
        await registerRequest({
          username: value.username.trim(),
          full_name: value.full_name.trim(),
          email: value.email.trim(),
          password: value.password,
        })
        // Tras registrarse, inicia sesión automáticamente.
        await login(value.username.trim(), value.password)
        navigate('/', { replace: true })
      } catch (err) {
        setError(handleApiError(err, 'No se pudo completar el registro'))
      }
    },
  })

  if (usuario) return <Navigate to="/" replace />

  return (
    <div className="mx-auto mt-8 max-w-md">
      <Card className="p-6">
        <h1 className="mb-1 text-2xl font-bold">Crear cuenta</h1>
        <p className="mb-6 text-sm text-stone-500">Registrate para hacer tus pedidos.</p>

        <form
          noValidate
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault()
            e.stopPropagation()
            void form.handleSubmit()
          }}
        >
          <form.Field
            name="username"
            validators={{
              onChange: ({ value }) => {
                const v = value.trim()
                if (v.length < 3) return 'Mínimo 3 caracteres'
                if (v.length > 50) return 'Máximo 50 caracteres'
                return undefined
              },
            }}
          >
            {(field) => (
              <Input
                label="Usuario"
                autoComplete="username"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
                error={fieldError(field.state.meta)}
              />
            )}
          </form.Field>

          <form.Field
            name="full_name"
            validators={{ onChange: ({ value }) => (value.trim() ? undefined : 'Ingresá tu nombre completo') }}
          >
            {(field) => (
              <Input
                label="Nombre completo"
                autoComplete="name"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
                error={fieldError(field.state.meta)}
              />
            )}
          </form.Field>

          <form.Field
            name="email"
            validators={{ onChange: ({ value }) => (EMAIL_RE.test(value.trim()) ? undefined : 'Email inválido') }}
          >
            {(field) => (
              <Input
                label="Email"
                type="email"
                autoComplete="email"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
                error={fieldError(field.state.meta)}
              />
            )}
          </form.Field>

          <form.Field
            name="password"
            validators={{
              onChange: ({ value }) => (value.length >= 8 ? undefined : 'La contraseña debe tener al menos 8 caracteres'),
            }}
          >
            {(field) => (
              <Input
                label="Contraseña"
                type="password"
                autoComplete="new-password"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
                error={fieldError(field.state.meta)}
              />
            )}
          </form.Field>

          <form.Field
            name="confirmar"
            validators={{
              onChangeListenTo: ['password'],
              onChange: ({ value, fieldApi }) =>
                value === fieldApi.form.getFieldValue('password') ? undefined : 'Las contraseñas no coinciden',
            }}
          >
            {(field) => (
              <Input
                label="Repetir contraseña"
                type="password"
                autoComplete="new-password"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
                error={fieldError(field.state.meta)}
              />
            )}
          </form.Field>

          <FormError mensaje={error} />

          <form.Subscribe selector={(s) => [s.canSubmit, s.isSubmitting] as const}>
            {([canSubmit, isSubmitting]) => (
              <Button type="submit" disabled={!canSubmit} loading={isSubmitting}>
                Crear cuenta
              </Button>
            )}
          </form.Subscribe>
        </form>

        <p className="mt-4 text-center text-sm text-stone-500">
          ¿Ya tenés cuenta?{' '}
          <Link to="/login" className="font-medium text-brand-700 hover:underline">
            Ingresá
          </Link>
        </p>
      </Card>
    </div>
  )
}
