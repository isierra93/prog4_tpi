import { useForm } from '@tanstack/react-form'

import { FormError } from '../../../shared/components/FormError'
import { Button } from '../../../shared/ui/Button'
import { Input, Select, Textarea } from '../../../shared/ui/Input'
import { fieldError } from '../../../shared/utils/fieldError'
import type { Categoria } from '../../categorias/types/categoria'
import type { Producto, ProductoCreate } from '../types/producto'

interface ProductoFormProps {
  inicial?: Producto | null
  categorias: Categoria[]
  error: string | null
  onGuardar: (values: ProductoCreate) => Promise<void>
  onCancelar: () => void
}

function numero(valor: string): number {
  return valor === '' ? Number.NaN : Number(valor)
}

export function ProductoForm({ inicial, categorias, error, onGuardar, onCancelar }: ProductoFormProps) {
  const form = useForm({
    defaultValues: {
      nombre: inicial?.nombre ?? '',
      descripcion: inicial?.descripcion ?? '',
      precio_base: inicial?.precio_base ?? 0,
      imagen_url: inicial?.imagen_url ?? '',
      stock: inicial?.stock ?? 0,
      disponible: inicial?.disponible ?? true,
      categoria_id: inicial?.categoria_id ?? 0,
    },
    onSubmit: async ({ value }) =>
      onGuardar({
        nombre: value.nombre.trim(),
        descripcion: value.descripcion.trim() || null,
        precio_base: value.precio_base,
        imagen_url: value.imagen_url.trim() || null,
        stock: value.stock,
        disponible: value.disponible,
        categoria_id: value.categoria_id,
      }),
  })

  return (
    <form
      noValidate
      className="grid gap-4 sm:grid-cols-2"
      onSubmit={(e) => {
        e.preventDefault()
        e.stopPropagation()
        void form.handleSubmit()
      }}
    >
      <div className="sm:col-span-2">
        <form.Field
          name="nombre"
          validators={{
            onChange: ({ value }) => {
              const largo = value.trim().length
              if (largo < 1) return 'El nombre es obligatorio'
              if (largo > 150) return 'Máximo 150 caracteres'
              return undefined
            },
          }}
        >
          {(field) => (
            <Input
              label="Nombre"
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              onBlur={field.handleBlur}
              error={fieldError(field.state.meta)}
            />
          )}
        </form.Field>
      </div>

      <div className="sm:col-span-2">
        <form.Field name="descripcion">
          {(field) => (
            <Textarea
              label="Descripción"
              rows={2}
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              onBlur={field.handleBlur}
            />
          )}
        </form.Field>
      </div>

      <form.Field
        name="categoria_id"
        validators={{ onChange: ({ value }) => (value > 0 ? undefined : 'Elegí una categoría') }}
      >
        {(field) => (
          <Select
            label="Categoría"
            value={field.state.value || ''}
            onChange={(e) => field.handleChange(Number(e.target.value))}
            onBlur={field.handleBlur}
            error={fieldError(field.state.meta)}
          >
            <option value="">Seleccionar...</option>
            {categorias.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </Select>
        )}
      </form.Field>

      <form.Field
        name="precio_base"
        validators={{
          onChange: ({ value }) => (Number.isFinite(value) && value >= 0 ? undefined : 'El precio debe ser mayor o igual a 0'),
        }}
      >
        {(field) => (
          <Input
            label="Precio"
            type="number"
            min={0}
            step="0.01"
            value={Number.isNaN(field.state.value) ? '' : field.state.value}
            onChange={(e) => field.handleChange(numero(e.target.value))}
            onBlur={field.handleBlur}
            error={fieldError(field.state.meta)}
          />
        )}
      </form.Field>

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
            onChange={(e) => field.handleChange(numero(e.target.value))}
            onBlur={field.handleBlur}
            error={fieldError(field.state.meta)}
          />
        )}
      </form.Field>

      <form.Field name="disponible">
        {(field) => (
          <label className="flex items-center gap-2 self-end pb-2 text-sm font-medium text-stone-700">
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

      <div className="sm:col-span-2">
        <form.Field
          name="imagen_url"
          validators={{
            onChange: ({ value }) =>
              value.trim() === '' || /^https?:\/\/\S+$/.test(value.trim()) ? undefined : 'Ingresá una URL válida (http o https)',
          }}
        >
          {(field) => (
            <Input
              label="URL de la imagen"
              placeholder="https://..."
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              onBlur={field.handleBlur}
              error={fieldError(field.state.meta)}
            />
          )}
        </form.Field>
      </div>

      <div className="sm:col-span-2">
        <FormError mensaje={error} />
      </div>

      <div className="flex justify-end gap-2 sm:col-span-2">
        <Button variant="secondary" onClick={onCancelar}>
          Cancelar
        </Button>
        <form.Subscribe selector={(s) => [s.canSubmit, s.isSubmitting] as const}>
          {([canSubmit, isSubmitting]) => (
            <Button type="submit" disabled={!canSubmit} loading={isSubmitting}>
              Guardar
            </Button>
          )}
        </form.Subscribe>
      </div>
    </form>
  )
}
