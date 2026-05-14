'use client'

import { useState } from 'react'
import { Mail, Copy, Check, Pencil, X, Save } from 'lucide-react'

interface TripCommunicationsPanelProps {
  tripId: string
  shareMessage: string
  tripLink: string
  specialNotes?: string | null
}

/**
 * TripCommunicationsPanel — MASTER_DESIGN §14.2
 *
 * Shows the operator the exact message guests receive,
 * and the captain notes field. Both are editable inline.
 * Section kicker: MessageSquare + COMMUNICATIONS
 */
export function TripCommunicationsPanel({
  tripId,
  shareMessage,
  tripLink,
  specialNotes,
}: TripCommunicationsPanelProps) {
  const [copiedMsg, setCopiedMsg] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)
  const [editingMessage, setEditingMessage] = useState(false)
  const [messageText, setMessageText] = useState(shareMessage)
  const [savedMessage, setSavedMessage] = useState(shareMessage)
  const [savingMessage, setSavingMessage] = useState(false)
  const [messageSaved, setMessageSaved] = useState(false)

  const [editingNotes, setEditingNotes] = useState(false)
  const [notesText, setNotesText] = useState(specialNotes ?? '')
  const [savedNotes, setSavedNotes] = useState(specialNotes ?? '')
  const [savingNotes, setSavingNotes] = useState(false)
  const [notesSaved, setNotesSaved] = useState(false)

  async function copyMessage() {
    await navigator.clipboard.writeText(savedMessage)
    setCopiedMsg(true)
    setTimeout(() => setCopiedMsg(false), 2000)
  }

  async function copyLink() {
    await navigator.clipboard.writeText(tripLink)
    setCopiedLink(true)
    setTimeout(() => setCopiedLink(false), 2000)
  }

  async function saveNotes() {
    setSavingNotes(true)
    try {
      await fetch(`/api/dashboard/trips/${tripId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ specialNotes: notesText }),
      })
      setSavedNotes(notesText)
      setEditingNotes(false)
      setNotesSaved(true)
      setTimeout(() => setNotesSaved(false), 2000)
    } catch {
      // silent — user can retry
    } finally {
      setSavingNotes(false)
    }
  }

  return (
    <section style={{ marginTop: 'var(--s-8)' }}>
      {/* ── Section kicker ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--s-2)',
          paddingBottom: 'var(--s-3)',
          borderBottom: 'var(--border-w) solid var(--border, #dde2ea)',
          marginBottom: 'var(--s-4)',
        }}
      >
        <Mail
          size={14}
          strokeWidth={2}
          style={{ color: 'var(--muted, #6b7280)', flexShrink: 0 }}
        />
        <span
          className="font-mono"
          style={{
            fontSize: '13px',
            fontWeight: 700,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: 'var(--ink, #111c2d)',
          }}
        >
          Communications
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-4)' }}>

        {/* ── Guest invitation message ── */}
        <div className="tile" style={{ overflow: 'hidden', padding: 0 }}>
          {/* Sub-header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: 'var(--s-3) var(--s-5)',
              background: 'var(--off, #f5f7fa)',
              borderBottom: '1px solid var(--border, #dde2ea)',
            }}
          >
            <span
              className="font-mono"
              style={{
                fontSize: '11px',
                fontWeight: 600,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: 'var(--muted, #6b7280)',
              }}
            >
              Guest invitation message
            </span>
            {!editingMessage ? (
              <button
                onClick={() => { setEditingMessage(true); setMessageText(savedMessage) }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--s-1)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--muted, #6b7280)',
                  fontSize: '12px',
                  fontWeight: 500,
                  padding: 0,
                }}
              >
                <Pencil size={12} strokeWidth={2} />
                Edit
              </button>
            ) : (
              <button
                onClick={() => { setEditingMessage(false); setMessageText(savedMessage) }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--s-1)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--muted, #6b7280)',
                  fontSize: '12px',
                  fontWeight: 500,
                  padding: 0,
                }}
              >
                <X size={12} strokeWidth={2} />
                Cancel
              </button>
            )}
          </div>

          {/* Message body */}
          <div style={{ padding: 'var(--s-4) var(--s-5)' }}>
            {editingMessage ? (
              <textarea
                value={messageText}
                onChange={e => setMessageText(e.target.value)}
                rows={8}
                className="field-input"
                style={{
                  width: '100%',
                  resize: 'vertical',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '12px',
                  lineHeight: 1.6,
                  color: 'var(--ink, #111c2d)',
                }}
              />
            ) : (
              <pre
                className="font-mono"
                style={{
                  fontSize: '12px',
                  lineHeight: 1.7,
                  color: 'var(--ink, #111c2d)',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  margin: 0,
                }}
              >
                {savedMessage}
              </pre>
            )}
          </div>

          {/* Actions */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: editingMessage ? '1fr 1fr' : '1fr 1fr',
              borderTop: '1px solid var(--border, #dde2ea)',
            }}
          >
            {editingMessage ? (
              <>
                <button
                  onClick={copyMessage}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 'var(--s-2)',
                    height: 44,
                    fontSize: '13px',
                    fontWeight: 500,
                    background: copiedMsg ? 'var(--v-soft, #ecfdf5)' : 'var(--off, #f5f7fa)',
                    color: copiedMsg ? 'var(--verified, #059669)' : 'var(--muted, #6b7280)',
                    border: 'none',
                    borderRight: '1px solid var(--border, #dde2ea)',
                    cursor: 'pointer',
                  }}
                >
                  {copiedMsg ? <Check size={13} strokeWidth={2.5} /> : <Copy size={13} strokeWidth={2} />}
                  {copiedMsg ? 'Copied' : 'Copy current'}
                </button>
                <button
                  onClick={async () => {
                    setSavingMessage(true)
                    setSavedMessage(messageText)
                    setEditingMessage(false)
                    setMessageSaved(true)
                    setSavingMessage(false)
                    setTimeout(() => setMessageSaved(false), 2000)
                  }}
                  disabled={savingMessage}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 'var(--s-2)',
                    height: 44,
                    fontSize: '13px',
                    fontWeight: 600,
                    background: messageSaved ? 'var(--v-soft, #ecfdf5)' : 'var(--ink, #111c2d)',
                    color: messageSaved ? 'var(--verified, #059669)' : 'var(--off, #f5f7fa)',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  {messageSaved
                    ? <><Check size={13} strokeWidth={2.5} /> Saved</>
                    : <><Save size={13} strokeWidth={2} /> Save message</>
                  }
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={copyMessage}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 'var(--s-2)',
                    height: 44,
                    fontSize: '13px',
                    fontWeight: 600,
                    background: copiedMsg ? 'var(--v-soft, #ecfdf5)' : 'var(--off, #f5f7fa)',
                    color: copiedMsg ? 'var(--verified, #059669)' : 'var(--ink, #111c2d)',
                    border: 'none',
                    borderRight: '1px solid var(--border, #dde2ea)',
                    cursor: 'pointer',
                    transition: 'background var(--dur-fast) var(--ease)',
                  }}
                >
                  {copiedMsg ? <Check size={13} strokeWidth={2.5} /> : <Copy size={13} strokeWidth={2} />}
                  {copiedMsg ? 'Copied' : 'Copy message'}
                </button>
                <button
                  onClick={copyLink}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 'var(--s-2)',
                    height: 44,
                    fontSize: '13px',
                    fontWeight: 500,
                    background: copiedLink ? 'var(--v-soft, #ecfdf5)' : 'var(--off, #f5f7fa)',
                    color: copiedLink ? 'var(--verified, #059669)' : 'var(--muted, #6b7280)',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'background var(--dur-fast) var(--ease)',
                  }}
                >
                  {copiedLink ? <Check size={13} strokeWidth={2.5} /> : <Copy size={13} strokeWidth={2} />}
                  {copiedLink ? 'Link copied' : 'Copy link'}
                </button>
              </>
            )}
          </div>
        </div>

        {/* ── Captain / operator notes ── */}
        <div className="tile" style={{ overflow: 'hidden', padding: 0 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: 'var(--s-3) var(--s-5)',
              background: 'var(--off, #f5f7fa)',
              borderBottom: '1px solid var(--border, #dde2ea)',
            }}
          >
            <span
              className="font-mono"
              style={{
                fontSize: '11px',
                fontWeight: 600,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: 'var(--muted, #6b7280)',
              }}
            >
              Captain notes
            </span>
            {notesSaved && (
              <span
                className="font-mono"
                style={{ fontSize: '11px', color: 'var(--verified, #059669)' }}
              >
                <Check size={10} strokeWidth={2.5} style={{ display: 'inline', marginRight: 4 }} />
                Saved
              </span>
            )}
            {!editingNotes && !notesSaved ? (
              <button
                onClick={() => { setEditingNotes(true); setNotesText(savedNotes) }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 'var(--s-1)',
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--muted, #6b7280)', fontSize: '12px', fontWeight: 500, padding: 0,
                }}
              >
                <Pencil size={12} strokeWidth={2} />
                Edit
              </button>
            ) : editingNotes ? (
              <button
                onClick={() => { setEditingNotes(false); setNotesText(savedNotes) }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 'var(--s-1)',
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--muted, #6b7280)', fontSize: '12px', fontWeight: 500, padding: 0,
                }}
              >
                <X size={12} strokeWidth={2} />
                Cancel
              </button>
            ) : null}
          </div>

          <div style={{ padding: 'var(--s-4) var(--s-5)' }}>
            {editingNotes ? (
              <textarea
                value={notesText}
                onChange={e => setNotesText(e.target.value)}
                rows={4}
                placeholder="Internal notes for the captain not visible to guests."
                className="field-input"
                style={{
                  width: '100%',
                  resize: 'vertical',
                  fontSize: '13px',
                  lineHeight: 1.6,
                }}
              />
            ) : savedNotes ? (
              <p
                style={{
                  fontSize: '13px',
                  lineHeight: 1.6,
                  color: 'var(--ink, #111c2d)',
                  margin: 0,
                  whiteSpace: 'pre-wrap',
                }}
              >
                {savedNotes}
              </p>
            ) : (
              <p
                style={{
                  fontSize: '13px',
                  color: 'var(--muted, #6b7280)',
                  fontStyle: 'italic',
                  margin: 0,
                }}
              >
                No captain notes. Tap Edit to add internal notes for the captain.
              </p>
            )}
          </div>

          {editingNotes && (
            <div style={{ borderTop: '1px solid var(--border, #dde2ea)' }}>
              <button
                onClick={saveNotes}
                disabled={savingNotes}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 'var(--s-2)',
                  width: '100%',
                  height: 44,
                  fontSize: '13px',
                  fontWeight: 600,
                  background: 'var(--ink, #111c2d)',
                  color: 'var(--off, #f5f7fa)',
                  border: 'none',
                  cursor: 'pointer',
                  opacity: savingNotes ? 0.6 : 1,
                }}
              >
                <Save size={13} strokeWidth={2} />
                {savingNotes ? 'Saving...' : 'Save notes'}
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
