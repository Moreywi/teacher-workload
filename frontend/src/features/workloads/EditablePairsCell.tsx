import { useEffect, useRef, useState } from 'react'

interface Props {
  value: number
  onSave: (newValue: number) => void
  disabled?: boolean
}

export function EditablePairsCell({ value, onSave, disabled }: Props) {
  const [draft, setDraft] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const isEditing = draft !== null
  const displayValue = isEditing ? draft : String(value)

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus()
      inputRef.current?.select()
    }
  }, [isEditing])

  const commit = () => {
    const parsed = Number(draft)
    if (Number.isInteger(parsed) && parsed > 0 && parsed !== value) {
      onSave(parsed)
    }
    setDraft(null)
  }

  const cancel = () => {
    setDraft(null)
  }

  const startEdit = () => {
    if (disabled) return
    setDraft(String(value))
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
        className="w-16 px-1 py-0.5 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    )
  }

  return (
    <button
      type="button"
      onClick={startEdit}
      disabled={disabled}
      className="px-1 py-0.5 rounded hover:bg-gray-100 text-left disabled:cursor-not-allowed"
      title="Нажмите, чтобы изменить"
    >
      {displayValue}
    </button>
  )
}