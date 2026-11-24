/** Primer error de un campo de TanStack Form, solo si el campo ya fue tocado. */
export function fieldError(meta: { isTouched: boolean; errors: unknown[] }): string | undefined {
  if (!meta.isTouched) return undefined
  const primero = meta.errors.find((e) => typeof e === 'string' && e.length > 0)
  return typeof primero === 'string' ? primero : undefined
}
