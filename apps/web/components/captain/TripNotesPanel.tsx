'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { ChevronDown, Save } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface TripNotesPanelProps {
  token: string
  initialNotes: string
}

export function TripNotesPanel({ token, initialNotes }: TripNotesPanelProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [notes, setNotes] = useState(initialNotes)
  const [savedNotes, setSavedNotes] = useState(initialNotes)
  const [saving, setSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<string | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const isDirty = notes !== savedNotes

  // Auto-save after 3s of inactivity
  useEffect(() => {
    if (!isDirty) return
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => {
      saveNotes()
    }, 3000)
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notes])

  const saveNotes = useCallback(async () => {
    if (saving || notes === savedNotes) return
    setSaving(true)
    try {
      const res = await fetch(`/api/captain/${token}/notes`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes }),
      })
      if (res.ok) {
        setSavedNotes(notes)
        setLastSaved(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))
      }
    } catch {
      // Silently fail — will retry on next auto-save
    } finally {
      setSaving(false)
    }
  }, [notes, savedNotes, saving, token])

  const addTimestampedEntry = useCallback(() => {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    const prefix = notes.trim() ? `\n${time} — ` : `${time} — `
    setNotes(prev => prev + prefix)
    // Focus the textarea and move cursor to end
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus()
        textareaRef.current.selectionStart = textareaRef.current.value.length
        textareaRef.current.selectionEnd = textareaRef.current.value.length
      }
    }, 50)
  }, [notes])

  return (
    <div className="bg-white rounded-[20px] border border-[#D0E2F3] overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-5 py-4 flex items-center justify-between"
      >
        <div className="flex items-center gap-2">
          <span className="text-[16px]">📝</span>
          <span className="text-[15px] font-semibold text-[#0D1B2A]">
            Trip Log
          </span>
          {isDirty && (
            <span className="w-2 h-2 rounded-full bg-[#E5910A] animate-pulse" />
          )}
          {lastSaved && !isDirty && (
            <span className="text-[11px] text-[#6B7C93]">
              Saved {lastSaved}
            </span>
          )}
        </div>
        <ChevronDown
          size={16}
          className={cn(
            'text-[#6B7C93] transition-transform',
            isOpen && 'rotate-180'
          )}
        />
      </button>

      {isOpen && (
        <div className="px-4 pb-4 border-t border-[#F5F8FC]">
          <p className="text-[12px] text-[#6B7C93] mt-3 mb-2">
            Log weather changes, incidents, fuel readings, or observations. Auto-saves after 3s.
          </p>

          <textarea
            ref={textareaRef}
            value={notes}
            onChange={e => setNotes(e.target.value)}
            maxLength={5000}
            rows={5}
            placeholder="10:15 — Wind picked up to 15kt NE&#10;10:45 — Moved to lee side of island&#10;11:30 — Guest reported mild nausea"
            className="
              w-full px-4 py-3 rounded-[12px] text-[14px]
              border border-[#D0E2F3] bg-[#F5F8FC] text-[#0D1B2A]
              placeholder:text-[#6B7C93]/50
              resize-none
              focus:outline-none focus:border-[#0C447C] focus:bg-white
              transition-colors
            "
          />

          <div className="flex items-center justify-between mt-2">
            <button
              type="button"
              onClick={addTimestampedEntry}
              className="text-[12px] font-medium text-[#0C447C] hover:underline"
            >
              + Add timestamped entry
            </button>

            <div className="flex items-center gap-2">
              <span className="text-[11px] text-[#6B7C93]">
                {notes.length} / 5000
              </span>
              <button
                type="button"
                onClick={saveNotes}
                disabled={!isDirty || saving}
                className="
                  flex items-center gap-1.5 px-3 py-1.5 rounded-[8px]
                  text-[12px] font-semibold
                  bg-[#0C447C] text-white
                  hover:bg-[#093a6b] transition-colors
                  disabled:opacity-40
                "
              >
                <Save size={12} />
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
