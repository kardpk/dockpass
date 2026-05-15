'use client'

import { useState } from 'react'
import { Copy, Check, Pencil, X, Save } from 'lucide-react'

interface TripCommunicationsPanelProps {
  tripId: string; shareMessage: string; tripLink: string; specialNotes?: string | null
}

export function TripCommunicationsPanel({ tripId, shareMessage, tripLink, specialNotes }: TripCommunicationsPanelProps) {
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
    setCopiedMsg(true); setTimeout(() => setCopiedMsg(false), 2000)
  }
  async function copyLink() {
    await navigator.clipboard.writeText(tripLink)
    setCopiedLink(true); setTimeout(() => setCopiedLink(false), 2000)
  }
  async function saveNotes() {
    setSavingNotes(true)
    try {
      await fetch(`/api/dashboard/trips/${tripId}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ specialNotes: notesText }),
      })
      setSavedNotes(notesText); setEditingNotes(false)
      setNotesSaved(true); setTimeout(() => setNotesSaved(false), 2000)
    } catch {} finally { setSavingNotes(false) }
  }

  return (
    <section>
      <div className="td-kicker">
        <span className="td-kicker-label">Communications</span>
      </div>

      <div className="td-gap-8">
        {/* Guest invitation message */}
        <div className="td-panel">
          <div className="td-panel-header">
            <span className="td-panel-label">Guest invitation message</span>
            {editingMessage ? (
              <button onClick={() => { setEditingMessage(false); setMessageText(savedMessage) }} className="td-btn-ghost">
                <X size={11} strokeWidth={2} /> Cancel
              </button>
            ) : (
              <button onClick={() => { setEditingMessage(true); setMessageText(savedMessage) }} className="td-btn-ghost">
                <Pencil size={11} strokeWidth={2} /> Edit
              </button>
            )}
          </div>

          <div className="td-panel-body">
            {editingMessage ? (
              <textarea value={messageText} onChange={e => setMessageText(e.target.value)} rows={7} className="td-textarea" />
            ) : (
              <pre style={{ fontFamily: 'var(--td-mono)', fontSize: 12, lineHeight: 1.7, color: 'var(--td-navy)', whiteSpace: 'pre-wrap', wordBreak: 'break-word', margin: 0 }}>
                {savedMessage}
              </pre>
            )}
          </div>

          <div className="td-btn-split td-panel-footer">
            {editingMessage ? (
              <>
                <button onClick={copyMessage} className={`td-btn-split-item ${copiedMsg ? 'copied' : ''}`}>
                  {copiedMsg ? <Check size={11} strokeWidth={2.5} /> : <Copy size={11} strokeWidth={2} />}
                  {copiedMsg ? 'Copied' : 'Copy current'}
                </button>
                <button
                  onClick={async () => {
                    setSavingMessage(true); setSavedMessage(messageText); setEditingMessage(false)
                    setMessageSaved(true); setSavingMessage(false); setTimeout(() => setMessageSaved(false), 2000)
                  }}
                  disabled={savingMessage}
                  className="td-btn-split-item"
                  style={{ color: messageSaved ? 'var(--td-ok)' : 'var(--td-navy)', fontWeight: 600 }}
                >
                  {messageSaved ? <><Check size={11} strokeWidth={2.5} /> Saved</> : <><Save size={11} strokeWidth={2} /> Save</>}
                </button>
              </>
            ) : (
              <>
                <button onClick={copyMessage} className={`td-btn-split-item ${copiedMsg ? 'copied' : ''}`}>
                  {copiedMsg ? <Check size={11} strokeWidth={2.5} /> : <Copy size={11} strokeWidth={2} />}
                  {copiedMsg ? 'Copied' : 'Copy message'}
                </button>
                <button onClick={copyLink} className={`td-btn-split-item ${copiedLink ? 'copied' : ''}`}>
                  {copiedLink ? <Check size={11} strokeWidth={2.5} /> : <Copy size={11} strokeWidth={2} />}
                  {copiedLink ? 'Link copied' : 'Copy link'}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Captain notes */}
        <div className="td-panel">
          <div className="td-panel-header">
            <span className="td-panel-label">Captain notes</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {notesSaved && (
                <span style={{ fontFamily: 'var(--td-mono)', fontSize: 10, color: 'var(--td-ok)', display: 'flex', alignItems: 'center', gap: 3 }}>
                  <Check size={8} strokeWidth={2.5} /> Saved
                </span>
              )}
              {editingNotes ? (
                <button onClick={() => { setEditingNotes(false); setNotesText(savedNotes) }} className="td-btn-ghost">
                  <X size={11} strokeWidth={2} /> Cancel
                </button>
              ) : !notesSaved ? (
                <button onClick={() => { setEditingNotes(true); setNotesText(savedNotes) }} className="td-btn-ghost">
                  <Pencil size={11} strokeWidth={2} /> Edit
                </button>
              ) : null}
            </div>
          </div>
          <div className="td-panel-body">
            {editingNotes ? (
              <textarea value={notesText} onChange={e => setNotesText(e.target.value)} rows={4}
                placeholder="Internal notes for the captain, not visible to guests."
                className="td-textarea" />
            ) : savedNotes ? (
              <p style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--td-navy)', margin: 0, whiteSpace: 'pre-wrap' }}>
                {savedNotes}
              </p>
            ) : (
              <p style={{ fontSize: 12, color: 'var(--td-navy-faint)', fontStyle: 'italic', margin: 0 }}>
                No captain notes. Tap Edit to add internal notes.
              </p>
            )}
          </div>
          {editingNotes && (
            <div className="td-panel-footer" style={{ padding: '10px 12px' }}>
              <button onClick={saveNotes} disabled={savingNotes} className="td-btn-primary" style={{ height: 38, fontSize: 11 }}>
                <Save size={11} strokeWidth={2} />
                {savingNotes ? 'Saving...' : 'Save notes'}
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
