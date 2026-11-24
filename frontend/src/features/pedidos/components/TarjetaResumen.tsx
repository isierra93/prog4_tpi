import { Card } from '../../../shared/ui/Card'

interface TarjetaResumenProps {
  titulo: string
  valor: string | number
  detalle?: string
  acento?: string
}

export function TarjetaResumen({ titulo, valor, detalle, acento = 'border-l-stone-300' }: TarjetaResumenProps) {
  return (
    <Card className={`border-l-4 p-5 ${acento}`}>
      <p className="text-sm font-medium text-stone-500">{titulo}</p>
      <p className="mt-1 text-3xl font-bold tabular-nums">{valor}</p>
      {detalle && <p className="mt-1 text-xs text-stone-400">{detalle}</p>}
    </Card>
  )
}
