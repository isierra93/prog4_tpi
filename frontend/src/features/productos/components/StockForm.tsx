import { useForm } from '@tanstack/react-form'

import { FormError } from '../../../shared/components/FormError'
import { Button } from '../../../shared/ui/Button'
import { Input } from '../../../shared/ui/Input'
import { fieldError } from '../../../shared/utils/fieldError'
import type { Producto, ProductoStockUpdate } from '../types/producto'

interface StockFormProps {
  producto: Producto
  error: string | null
  onGuardar: (values: ProductoStockUpdate) => Promise<void>
  onCancelar: () => void
}

/** Cambio rápido de stock y disponibilidad (PATCH /productos/{id}/stock). */
export function StockForm({ producto, error, onGuardar, onCancelar }: StockFormProps) {
  const form = useForm({
    defaultValues: { stock: producto.stock, disponible: producto.disponible },
    onSubmit: async ({ value }) => onGuardar(value),
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
      <p className="text-sm text-stone-500">
        Producto: <strong className="text-stone-800">{producto.nombre}</strong>
      </p>

      <form.Field
        name="stock"
        validators={{
          onChange: ({ value }) =>
            Number.isInteger(value) && value >= 0 ? undefined : 'El stock debe ser un entero mayor o igual a 0',
        }}
      >
        {(field) => (
          <Input
            label="Stock"
            type="number"
            min={0}
            step={1}
            value={Number.isNaN(field.state.value) ? '' : field.state.value}
            onChange={(e) => field.handleChange(e.target.value === '' ? Number.NaN : Number(e.target.value))}
            onBlur={field.handleBlur}
            error={fieldError(field.state.meta)}
          />
        )}
      </form.Field>

      <form.Field name="disponible">
        {(field) => (
          <label className="flex items-center gap-2 text-sm font-medium text-stone-700">
            <input
              type="checkbox"
              className="size-4 accent-brand-600"
              checked={field.state.value}
              onChange={(e) => field.handleChange(e.target.checked)}
            />
            Disponible para la venta
          </label>
        )}
      </form.Field>

      <FormError mensaje={error} />

      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={onCancelar}>
          Cancelar
        </Button>
        <form.Subscribe selector={(s) => [s.canSubmit, s.isSubmitting] as const}>
          {([canSubmit, isSubmitting]) => (
            <Button type="submit" disabled={!canSubmit} loading={isSubmitting}>
              Actualizar stock
            </Button>
          )}
        </form.Subscribe>
      </div>
    </form>
  )
}
