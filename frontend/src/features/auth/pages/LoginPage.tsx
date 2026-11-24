import { useForm } from '@tanstack/react-form'
import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'

import { handleApiError } from '../../../shared/api/handleApiError'
import { FormError } from '../../../shared/components/FormError'
import { Button } from '../../../shared/ui/Button'
import { Card } from '../../../shared/ui/Card'
import { Input } from '../../../shared/ui/Input'
import { fieldError } from '../../../shared/utils/fieldError'
import { useAuthStore } from '../../../store/authStore'

interface LocationState {
  from?: string
}

export function LoginPage() {
  const usuario = useAuthStore((s) => s.usuario)
  const cargando = useAuthStore((s) => s.cargando)
  const login = useAuthStore((s) => s.login)
  const navigate = useNavigate()
  const location = useLocation()
  const [error, setError] = useState<string | null>(null)

  const destino = (location.state as LocationState | null)?.from ?? '/'

  const form = useForm({
    defaultValues: { username: '', password: '' },
    onSubmit: async ({ value }) => {
      setError(null)
      try {
        await login(value.username.trim(), value.password)
        navigate(destino, { replace: true })
      } catch (err) {
        setError(handleApiError(err, 'No se pudo iniciar sesión'))
      }
    },
  })

  if (!cargando && usuario) return <Navigate to={destino} replace />

  return (
    <div className="mx-auto mt-8 max-w-sm">
      <Card className="p-6">
        <h1 className="mb-1 text-2xl font-bold">Ingresar</h1>
        <p className="mb-6 text-sm text-stone-500">Accedé con tu usuario para hacer pedidos.</p>

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
            validators={{ onChange: ({ value }) => (value.trim() ? undefined : 'Ingresá tu usuario') }}
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
            name="password"
            validators={{ onChange: ({ value }) => (value ? undefined : 'Ingresá tu contraseña') }}
          >
            {(field) => (
              <Input
                label="Contraseña"
                type="password"
                autoComplete="current-password"
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
                Ingresar
              </Button>
            )}
          </form.Subscribe>
        </form>

        <p className="mt-4 text-center text-sm text-stone-500">
          ¿No tenés cuenta?{' '}
          <Link to="/register" className="font-medium text-brand-700 hover:underline">
            Registrate
          </Link>
        </p>
      </Card>
    </div>
  )
}
