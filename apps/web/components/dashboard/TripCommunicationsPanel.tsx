'use client'

import { useState } from 'react'
import { Copy, Check, Pencil, X, Save } from 'lucide-react'

interface TripCommunicationsPanelProps {
  tripId: string; shareMessage: string; tripLink: string; specialNotes?: string | null
}

export function TripCommunicationsPanel({ tripId, shareMessage, tripLink, specialNotes }: TripCommunicationsPanelProps) {
  const [copiedMsg, setCopiedMsg] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)
  const [editingMsg, setEditingMsg] = useState(false)
  const [msgText, setMsgText] = useState(shareMessage)
  const [savedMsg, setSavedMsg] = useState(shareMessage)
  const [msgSaved, setMsgSaved] = useState(false)
  const [editingNotes, setEditingNotes] = useState(false)
  const [notesText, setNotesText] = useState(specialNotes ?? '')
  const [savedNotes, setSavedNotes] = useState(specialNotes ?? '')
  const [savingNotes, setSavingNotes] = useState(false)
  const [notesSaved, setNotesSaved] = useState(false)

  async function copyMsg() { await navigator.clipboard.writeText(savedMsg); setCopiedMsg(true); setTimeout(() => setCopiedMsg(false), 2000) }
  async function copyLink() { await navigator.clipboard.writeText(tripLink); setCopiedLink(true); setTimeout(() => setCopiedLink(false), 2000) }
  async function saveNotes() {
    setSavingNotes(true)
    try {
      await fetch(`/api/dashboard/trips/${tripId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ specialNotes: notesText }) })
      setSavedNotes(notesText); setEditingNotes(false); setNotesSaved(true); setTimeout(() => setNotesSaved(false), 2000)
    } catch {} finally { setSavingNotes(false) }
  }

  return (
    <section>
      <div className="td-kicker">
        <span className="td-kicker-label">Communications</span>
      </div>

      <div className="td-gap-8">
        {/* Guest invitation — no filled header bg */}
        <div className="td-panel">
          <div className="td-panel-header">
            <span className="td-panel-label">Guest invitation message</span>
            {editingMsg
              ? <button onClick={() => { setEditingMsg(false); setMsgText(savedMsg) }} className="td-btn-ghost"><X size={11} strokeWidth={2} /> Cancel</button>
              : <button onClick={() => { setEditingMsg(true); setMsgText(savedMsg) }} className="td-btn-ghost"><Pencil size={11} strokeWidth={2} /> Edit</button>
            }
          </div>
          <div className="td-panel-body">
            {editingMsg
              ? <textarea value={msgText} onChange={e => setMsgText(e.target.value)} rows={7} className="td-textarea" />
              : <pre style={{ fontFamily: 'var(--td-mono)', fontSize: 12, lineHeight: 1.7, color: 'var(--td-text)', whiteSpace: 'pre-wrap', wordBreak: 'break-word', margin: 0 }}>{savedMsg}</pre>
            }
          </div>
          <div className="td-btn-split td-panel-footer">
            {editingMsg ? (
              <>
                <button onClick={copyMsg} className={`td-btn-split-item ${copiedMsg ? 'copied' : ''}`}>
                  {copiedMsg ? <Check size={11} strokeWidth={2.5} /> : <Copy size={11} strokeWidth={2} />}
                  {copiedMsg ? 'Copied' : 'Copy current'}
                </button>
                <button
                  onClick={() => { setSavedMsg(msgText); setEditingMsg(false); setMsgSaved(true); setTimeout(() => setMsgSaved(false), 2000) }}
                  className="td-btn-split-item" style={{ color: msgSaved ? 'var(--td-ok)' : 'var(--td-text)', fontWeight: 500 }}
                >
                  {msgSaved ? <><Check size={11} strokeWidth={2.5} /> Saved</> : <><Save size={11} strokeWidth={2} /> Save</>}
                </button>
              </>
            ) : (
              <>
                <button onClick={copyMsg} className={`td-btn-split-item ${copiedMsg ? 'copied' : ''}`}>
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
              {notesSaved && <span style={{ fontSize: 10, color: 'var(--td-ok)', display: 'flex', alignItems: 'center', gap: 3 }}><Check size={8} strokeWidth={2.5} /> Saved</span>}
              {editingNotes
                ? <button onClick={() => { setEditingNotes(false); setNotesText(savedNotes) }} className="td-btn-ghost"><X size={11} strokeWidth={2} /> Cancel</button>
                : !notesSaved && <button onClick={() => { setEditingNotes(true); setNotesText(savedNotes) }} className="td-btn-ghost"><Pencil size={11} strokeWidth={2} /> Edit</button>
              }
            </div>
          </div>
          <div className="td-panel-body">
            {editingNotes
              ? <textarea value={notesText} onChange={e => setNotesText(e.target.value)} rows={4} placeholder="Internal notes, not visible to guests." className="td-textarea" />
              : savedNotes
                ? <p style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--td-text)', margin: 0, whiteSpace: 'pre-wrap' }}>{savedNotes}</p>
                : <p style={{ fontSize: 12, color: 'var(--td-faint)', fontStyle: 'italic', margin: 0 }}>No captain notes. Tap Edit to add.</p>
            }
          </div>
          {editingNotes && (
            <div className="td-panel-footer" style={{ padding: '9px 12px' }}>
              <button onClick={saveNotes} disabled={savingNotes} className="td-btn-primary" style={{ height: 36, fontSize: 12 }}>
                <Save size={11} strokeWidth={2} />{savingNotes ? 'Saving...' : 'Save notes'}
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
