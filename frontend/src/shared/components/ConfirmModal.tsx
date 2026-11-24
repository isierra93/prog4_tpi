import type { ReactNode } from 'react'

import { Button } from '../ui/Button'
import { Modal } from '../ui/Modal'
import { FormError } from './FormError'

interface ConfirmModalProps {
  open: boolean
  titulo: string
  children: ReactNode
  confirmarTexto?: string
  cargando?: boolean
  error?: string | null
  onConfirmar: () => void
  onCerrar: () => void
}

export function ConfirmModal({
  open,
  titulo,
  children,
  confirmarTexto = 'Confirmar',
  cargando = false,
  error = null,
  onConfirmar,
  onCerrar,
}: ConfirmModalProps) {
  return (
    <Modal open={open} title={titulo} onClose={onCerrar}>
      <div className="flex flex-col gap-4">
        <div className="text-sm">{children}</div>
        <FormError mensaje={error} />
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onCerrar}>
            Volver
          </Button>
          <Button variant="danger" loading={cargando} onClick={onConfirmar}>
            {confirmarTexto}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
