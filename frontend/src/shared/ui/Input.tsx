import {
  useId,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react'

const BASE =
  'w-full rounded-lg border bg-white px-3 py-2 text-sm shadow-sm transition focus:outline-none focus:ring-2 disabled:bg-stone-100'
const OK = 'border-stone-300 focus:border-brand-500 focus:ring-brand-100'
const ERR = 'border-red-400 focus:border-red-500 focus:ring-red-100'

interface FieldWrapperProps {
  id: string
  label?: string
  error?: string
  children: ReactNode
}

function FieldWrapper({ id, label, error, children }: FieldWrapperProps) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-stone-700">
          {label}
        </label>
      )}
      {children}
      {error && (
        <p id={`${id}-error`} className="text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  )
}

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export function Input({ label, error, id, className = '', ...props }: InputProps) {
  const autoId = useId()
  const inputId = id ?? autoId
  return (
    <FieldWrapper id={inputId} label={label} error={error}>
      <input
        id={inputId}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${inputId}-error` : undefined}
        className={`${BASE} ${error ? ERR : OK} ${className}`}
        {...props}
      />
    </FieldWrapper>
  )
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
}

export function Select({ label, error, id, className = '', children, ...props }: SelectProps) {
  const autoId = useId()
  const selectId = id ?? autoId
  return (
    <FieldWrapper id={selectId} label={label} error={error}>
      <select
        id={selectId}
        aria-invalid={Boolean(error)}
        className={`${BASE} ${error ? ERR : OK} ${className}`}
        {...props}
      >
        {children}
      </select>
    </FieldWrapper>
  )
}

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
}

export function Textarea({ label, error, id, className = '', ...props }: TextareaProps) {
  const autoId = useId()
  const areaId = id ?? autoId
  return (
    <FieldWrapper id={areaId} label={label} error={error}>
      <textarea
        id={areaId}
        aria-invalid={Boolean(error)}
        className={`${BASE} ${error ? ERR : OK} ${className}`}
        {...props}
      />
    </FieldWrapper>
  )
}
