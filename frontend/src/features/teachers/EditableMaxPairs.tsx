import { useEffect, useRef, useState } from 'react'

interface Props {
  value: number | null
  onSave: (newValue: number | null) => void
  disabled?: boolean
}

export function EditableMaxPairs({ value, onSave, disabled }: Props) {
  const [draft, setDraft] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const isEditing = draft !== null
  const displayValue = isEditing ? draft : value === null ? '—' : String(value)

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus()
      inputRef.current?.select()
    }
  }, [isEditing])

  const commit = () => {
    const trimmed = (draft ?? '').trim()

    if (trimmed === '') {
      if (value !== null) onSave(null)
      setDraft(null)
      return
    }

    const parsed = Number(trimmed)
    if (Number.isInteger(parsed) && parsed > 0 && parsed !== value) {
      onSave(parsed)
    }
    setDraft(null)
  }

  const cancel = () => setDraft(null)

  const startEdit = () => {
    if (disabled) return
    setDraft(value === null ? '' : String(value))
  }

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        type="number"
        min={1}
        value={displayValue}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') commit()
          if (e.key === 'Escape') cancel()
        }}
        placeholder="без лимита"
        className="w-24 px-1 py-0.5 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    )
  }

  return (
    <button
      type="button"
      onClick={startEdit}
      disabled={disabled}
      className="px-1 py-0.5 rounded hover:bg-gray-100 text-left text-gray-500 disabled:cursor-not-allowed"
      title="Нажмите, чтобы изменить (пусто = без лимита)"
    >
      {displayValue}
    </button>
  )
}