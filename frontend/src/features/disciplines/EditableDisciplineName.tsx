import { useEffect, useRef, useState } from 'react'

interface Props {
  value: string
  onSave: (newValue: string) => void
  disabled?: boolean
}

export function EditableDisciplineName({ value, onSave, disabled }: Props) {
  // null — не редактируем, показываем value
  // string — редактируем
  const [draft, setDraft] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const isEditing = draft !== null
  const displayValue = isEditing ? draft : value

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus()
      inputRef.current?.select()
    }
  }, [isEditing])

  const commit = () => {
    const trimmed = (draft ?? '').trim()
    if (trimmed && trimmed !== value) {
      onSave(trimmed)
    }
    setDraft(null)
  }

  const cancel = () => setDraft(null)

  const startEdit = () => {
    if (disabled) return
    setDraft(value)
  }

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        type="text"
        value={displayValue}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') commit()
          if (e.key === 'Escape') cancel()
        }}
        maxLength={150}
        className="w-full px-1 py-0.5 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    )
  }

  return (
    <button
      type="button"
      onClick={startEdit}
      disabled={disabled}
      className="text-left rounded hover:bg-gray-100 px-1 py-0.5 disabled:cursor-not-allowed"
      title="Нажмите, чтобы переименовать"
    >
      {displayValue}
    </button>
  )
}