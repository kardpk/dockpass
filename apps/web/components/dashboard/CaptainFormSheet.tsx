'use client'

import { useState } from 'react'
import { Shield, Anchor, Users, HardHat, X, Briefcase, UserPlus, Pencil, Loader2, Check } from 'lucide-react'
import type { CaptainProfile, CrewRole } from '@/types'

interface CaptainFormSheetProps {
  captain?: CaptainProfile | null
  onSaved: (captain: CaptainProfile) => void
  onCancel: () => void
}

const LICENSE_TYPES = [
  'OUPV',
  'Master 25 Ton',
  'Master 50 Ton',
  'Master 100 Ton',
  'Master 200 Ton',
  'Master Unlimited',
  'Able Seaman',
  'Other',
] as const

const ROLE_OPTIONS: { value: CrewRole; label: string; Icon: typeof Shield; sub: string }[] = [
  { value: 'captain',    label: 'Captain',    Icon: Shield, sub: 'Licensed operator' },
  { value: 'first_mate', label: 'First Mate', Icon: Anchor, sub: 'Second in command' },
  { value: 'crew',       label: 'Crew',       Icon: Users,  sub: 'General crew' },
  { value: 'deckhand',   label: 'Deckhand',   Icon: HardHat, sub: 'Deck operations' },
]

export function CaptainFormSheet({ captain, onSaved, onCancel }: CaptainFormSheetProps) {
  const isEditing = !!captain

  const [form, setForm] = useState({
    fullName:       captain?.fullName ?? '',
    phone:          captain?.phone ?? '',
    email:          captain?.email ?? '',
    bio:            captain?.bio ?? '',
    defaultRole:    (captain?.defaultRole ?? 'captain') as CrewRole,
    licenseType:    captain?.licenseType ?? '',
    licenseNumber:  captain?.licenseNumber ?? '',
    licenseExpiry:  captain?.licenseExpiry ?? '',
    yearsExperience: captain?.yearsExperience?.toString() ?? '',
    isDefault:      captain?.isDefault ?? false,
  })

  const [saving, setSaving] = useState(false)
  const [savedOk, setSavedOk] = useState(false)
  const [error, setError] = useState('')

  const showLicense = form.defaultRole === 'captain' || form.defaultRole === 'first_mate'

  function update(key: string, value: string | boolean) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.fullName.trim()) { setError('Name is required'); return }

    setSaving(true)
    setError('')

    try {
      const url = isEditing
        ? `/api/dashboard/captains/${captain!.id}`
        : '/api/dashboard/captains'

      const res = await fetch(url, {
        method: isEditing ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName:       form.fullName.trim(),
          phone:          form.phone || null,
          email:          form.email || null,
          bio:            form.bio || null,
          defaultRole:    form.defaultRole,
          licenseType:    showLicense ? (form.licenseType || null) : null,
          licenseNumber:  showLicense ? (form.licenseNumber || null) : null,
          licenseExpiry:  showLicense ? (form.licenseExpiry || null) : null,
          yearsExperience: form.yearsExperience ? parseInt(form.yearsExperience) : null,
          isDefault:      form.isDefault,
        }),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error((body as { error?: string }).error || 'Failed to save')
      }

      const json = await res.json()
      setSavedOk(true)
      setTimeout(() => onSaved(json.data), 500)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  // ─── input shared style ───────────────────────────────────────────────────
  const inputStyle: React.CSSProperties = {
    width: '100%',
    height: 44,
    padding: '0 12px',
    borderRadius: 'var(--r-1)',
    border: '1px solid var(--color-line)',
    background: 'var(--color-paper)',
    fontSize: 14,
    color: 'var(--color-ink)',
    outline: 'none',
    transition: 'border-color 0.15s',
  }

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: 11,
    fontWeight: 600,
    color: 'var(--color-ink-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    marginBottom: 6,
  }

  return (
    // Backdrop
    <div
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(11,30,45,0.55)',
        backdropFilter: 'blur(4px)',
        zIndex: 50,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onCancel() }}
    >
      {/* Sheet — pushed up by 56px to clear the bottom nav bar */}
      <div
        style={{
          width: '100%',
          maxWidth: 560,
          maxHeight: 'calc(90vh - 56px)',   /* 56px = bottom nav height */
          marginBottom: 56,                  /* sit above nav */
          background: 'var(--color-paper)',
          borderRadius: '20px 20px 0 0',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 -8px 32px rgba(11,30,45,0.18)',
        }}
      >
        {/* ── Header ───────────────────────────────────────────────── */}
        <div
          style={{
            padding: '16px 20px',
            background: 'var(--color-ink)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {isEditing
              ? <Pencil size={16} strokeWidth={1.75} style={{ color: 'var(--color-brass)' }} />
              : <UserPlus size={16} strokeWidth={1.75} style={{ color: 'var(--color-brass)' }} />
            }
            <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--color-paper)', margin: 0 }}>
              {isEditing ? 'Edit crew member' : 'Add crew member'}
            </h2>
          </div>
          <button
            onClick={onCancel}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 28, height: 28, borderRadius: 6,
              background: 'rgba(232,225,210,0.12)',
              border: 'none', cursor: 'pointer',
              color: 'rgba(232,225,210,0.7)',
              transition: 'background 0.15s',
            }}
          >
            <X size={16} strokeWidth={2} />
          </button>
        </div>

        {/* ── Scrollable form ───────────────────────────────────────── */}
        <form
          onSubmit={handleSubmit}
          style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: 18 }}
        >

          {/* Role selector */}
          <div>
            <p style={labelStyle}>Role *</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {ROLE_OPTIONS.map(opt => {
                const active = form.defaultRole === opt.value
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => update('defaultRole', opt.value)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '10px 12px',
                      borderRadius: 'var(--r-1)',
                      border: active ? '2px solid var(--color-ink)' : '1.5px solid var(--color-line)',
                      background: active ? 'var(--color-ink)' : 'var(--color-bone)',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.15s',
                    }}
                  >
                    <opt.Icon
                      size={15} strokeWidth={1.75}
                      style={{ color: active ? 'var(--color-brass)' : 'var(--color-ink-muted)', flexShrink: 0 }}
                    />
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 600, color: active ? 'var(--color-paper)' : 'var(--color-ink)', margin: 0 }}>
                        {opt.label}
                      </p>
                      <p style={{ fontSize: 11, color: active ? 'rgba(232,225,210,0.6)' : 'var(--color-ink-muted)', margin: 0 }}>
                        {opt.sub}
                      </p>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Name */}
          <div>
            <label style={labelStyle} htmlFor="crewFullName">Full Name *</label>
            <input
              id="crewFullName"
              type="text"
              value={form.fullName}
              onChange={e => update('fullName', e.target.value)}
              placeholder="John Smith"
              style={inputStyle}
              autoFocus
            />
          </div>

          {/* Phone + Email */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle} htmlFor="crewPhone">Phone</label>
              <input id="crewPhone" type="tel" value={form.phone}
                onChange={e => update('phone', e.target.value)}
                placeholder="+1 (555) 000-0000" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle} htmlFor="crewEmail">Email</label>
              <input id="crewEmail" type="email" value={form.email}
                onChange={e => update('email', e.target.value)}
                placeholder="email@example.com" style={inputStyle} />
            </div>
          </div>

          {/* USCG License block — captain / first mate only */}
          {showLicense && (
            <div
              style={{
                padding: 14, borderRadius: 'var(--r-1)',
                background: 'var(--color-bone)',
                border: '1px solid var(--color-line)',
                display: 'flex', flexDirection: 'column', gap: 10,
              }}
            >
              <p style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: 4, margin: 0 }}>
                <Briefcase size={12} strokeWidth={2} /> USCG License
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ ...labelStyle, fontSize: 10 }} htmlFor="licenseType">License Type</label>
                  <select id="licenseType" value={form.licenseType}
                    onChange={e => update('licenseType', e.target.value)}
                    style={{ ...inputStyle, height: 40, fontSize: 13 }}
                  >
                    <option value="">Select…</option>
                    {LICENSE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ ...labelStyle, fontSize: 10 }} htmlFor="licenseNumber">License Number</label>
                  <input id="licenseNumber" type="text" value={form.licenseNumber}
                    onChange={e => update('licenseNumber', e.target.value)}
                    placeholder="MMC #"
                    style={{ ...inputStyle, height: 40, fontSize: 13 }} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ ...labelStyle, fontSize: 10 }} htmlFor="licenseExpiry">Expiry Date</label>
                  <input id="licenseExpiry" type="date" value={form.licenseExpiry}
                    onChange={e => update('licenseExpiry', e.target.value)}
                    style={{ ...inputStyle, height: 40, fontSize: 13 }} />
                </div>
                <div>
                  <label style={{ ...labelStyle, fontSize: 10 }} htmlFor="yearsExpLicense">Years Experience</label>
                  <input id="yearsExpLicense" type="number" min="0" max="80"
                    value={form.yearsExperience}
                    onChange={e => update('yearsExperience', e.target.value)}
                    placeholder="e.g. 10"
                    style={{ ...inputStyle, height: 40, fontSize: 13 }} />
                </div>
              </div>
            </div>
          )}

          {/* Years experience for non-captain roles */}
          {!showLicense && (
            <div>
              <label style={labelStyle} htmlFor="yearsExpGeneral">Years Experience</label>
              <input id="yearsExpGeneral" type="number" min="0" max="80"
                value={form.yearsExperience}
                onChange={e => update('yearsExperience', e.target.value)}
                placeholder="e.g. 5"
                style={inputStyle} />
            </div>
          )}

          {/* Bio */}
          <div>
            <label style={labelStyle} htmlFor="crewBio">Bio</label>
            <textarea
              id="crewBio"
              value={form.bio}
              onChange={e => update('bio', e.target.value)}
              placeholder="Short bio shown on guest trip pages…"
              rows={3}
              style={{
                ...inputStyle, height: 'auto',
                padding: '10px 12px',
                resize: 'none', lineHeight: 1.5,
              }}
            />
          </div>

          {/* Default toggle */}
          <label style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
            <div
              onClick={() => update('isDefault', !form.isDefault)}
              style={{
                width: 40, height: 24, borderRadius: 12,
                background: form.isDefault ? 'var(--color-ink)' : 'var(--color-line)',
                position: 'relative', transition: 'background 0.2s', flexShrink: 0,
              }}
            >
              <div style={{
                width: 18, height: 18, borderRadius: '50%',
                background: form.isDefault ? 'var(--color-brass)' : 'var(--color-paper)',
                position: 'absolute', top: 3,
                left: form.isDefault ? 19 : 3,
                transition: 'left 0.2s',
                boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
              }} />
            </div>
            <div>
              <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-ink)', margin: 0 }}>
                Set as default captain
              </p>
              <p style={{ fontSize: 11, color: 'var(--color-ink-muted)', margin: 0 }}>
                Auto-selected when creating new trips
              </p>
            </div>
          </label>

          {/* Error */}
          {error && (
            <div style={{
              padding: '10px 14px', borderRadius: 'var(--r-1)',
              background: 'rgba(180,60,60,0.06)',
              border: '1px solid rgba(180,60,60,0.2)',
              color: 'var(--color-status-err)', fontSize: 13,
            }}>
              {error}
            </div>
          )}
        </form>

        {/* ── Sticky footer CTA ─────────────────────────────────────── */}
        <div
          style={{
            padding: '12px 20px 16px',
            borderTop: '1px solid var(--color-line-soft)',
            display: 'flex', gap: 10, flexShrink: 0,
            background: 'var(--color-paper)',
          }}
        >
          <button
            type="button"
            onClick={onCancel}
            style={{
              flex: 1, height: 48,
              borderRadius: 'var(--r-1)',
              border: '1px solid var(--color-line)',
              background: 'var(--color-bone)',
              color: 'var(--color-ink-muted)',
              fontSize: 14, fontWeight: 500,
              cursor: 'pointer',
              transition: 'background 0.15s',
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={(e) => handleSubmit(e as unknown as React.FormEvent)}
            disabled={saving || savedOk || !form.fullName.trim()}
            style={{
              flex: 1, height: 48,
              borderRadius: 'var(--r-1)',
              border: 'none',
              background: savedOk ? 'var(--color-status-ok)' : 'var(--color-ink)',
              color: 'var(--color-paper)',
              fontSize: 14, fontWeight: 600,
              cursor: saving || savedOk ? 'default' : 'pointer',
              opacity: (!form.fullName.trim() && !saving) ? 0.4 : 1,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              transition: 'background 0.2s, opacity 0.15s',
            }}
          >
            {saving
              ? <><Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> Saving…</>
              : savedOk
              ? <><Check size={15} strokeWidth={2.5} /> Saved!</>
              : isEditing ? 'Save changes' : '+ Add crew member'
            }
          </button>
        </div>
      </div>
    </div>
  )
}
