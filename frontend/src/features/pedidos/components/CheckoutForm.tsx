import { useForm } from '@tanstack/react-form'

import { FormError } from '../../../shared/components/FormError'
import { Button } from '../../../shared/ui/Button'
import { Select, Textarea } from '../../../shared/ui/Input'
import { fieldError } from '../../../shared/utils/fieldError'
import { FORMAS_PAGO, type FormaPago } from '../types/pedido'

export interface CheckoutValues {
  direccion_entrega: string
  forma_pago: FormaPago
  notas: string
}

interface CheckoutFormProps {
  error: string | null
  onConfirmar: (values: CheckoutValues) => Promise<void>
}

const ETIQUETA_PAGO: Record<FormaPago, string> = {
  EFECTIVO: 'Efectivo',
  TRANSFERENCIA: 'Transferencia',
}

export function CheckoutForm({ error, onConfirmar }: CheckoutFormProps) {
  const form = useForm({
    defaultValues: { direccion_entrega: '', forma_pago: 'EFECTIVO', notas: '' } as CheckoutValues,
    onSubmit: async ({ value }) => onConfirmar(value),
  })

  return (
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
        name="direccion_entrega"
        validators={{
          onChange: ({ value }) => {
            const largo = value.trim().length
            if (largo < 5) return 'La dirección debe tener al menos 5 caracteres'
            if (largo > 200) return 'La dirección no puede superar los 200 caracteres'
            return undefined
          },
        }}
      >
        {(field) => (
          <Textarea
            label="Dirección de entrega"
            rows={2}
            placeholder="Calle, número, piso, ciudad"
            value={field.state.value}
            onChange={(e) => field.handleChange(e.target.value)}
            onBlur={field.handleBlur}
            error={fieldError(field.state.meta)}
          />
        )}
      </form.Field>

      <form.Field name="forma_pago">
        {(field) => (
          <Select
            label="Forma de pago"
            value={field.state.value}
            onChange={(e) => field.handleChange(e.target.value as FormaPago)}
            onBlur={field.handleBlur}
          >
            {FORMAS_PAGO.map((fp) => (
              <option key={fp} value={fp}>
                {ETIQUETA_PAGO[fp]}
              </option>
            ))}
          </Select>
        )}
      </form.Field>

      <form.Field
        name="notas"
        validators={{
          onChange: ({ value }) => (value.length > 500 ? 'Máximo 500 caracteres' : undefined),
        }}
      >
        {(field) => (
          <Textarea
            label="Notas (opcional)"
            rows={2}
            placeholder="Ej.: tocar timbre 2B, sin cebolla"
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
            Confirmar pedido
          </Button>
        )}
      </form.Subscribe>
    </form>
  )
}
