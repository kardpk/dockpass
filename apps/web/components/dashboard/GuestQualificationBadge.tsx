'use client'

import type { QualificationStatus } from '@/types'

/**
 * GuestQualificationBadge
 *
 * Compact status pill for guest qualification in the operator trip detail table.
 * Used in GuestManagementTable to indicate self-drive qualification status.
 *
 * Behaviour:
 *   required=false + status=null  → — (grey dash, not applicable)
 *   required=true  + status=null  → ⚠ Not submitted (amber)
 *   status='pending'              → ⏳ Pending (amber pill)
 *   status='approved'             → ✓ Approved (green pill)
 *   status='flagged'              → ⚠ Flagged (red/amber pill)
 *   status='rejected'             → ✗ Rejected (red pill)
 */

interface GuestQualificationBadgeProps {
  status: QualificationStatus | null
  required: boolean
}

const BADGE_CONFIG = {
  approved: {
    label: '✓ Approved',
    bg: 'rgba(31,107,82,0.08)',
    border: 'rgba(31,107,82,0.25)',
    color: 'var(--color-status-ok)',
  },
  pending: {
    label: '⏳ Pending',
    bg: 'rgba(181,150,89,0.08)',
    border: 'rgba(181,150,89,0.3)',
    color: '#8a6c2a',
  },
  flagged: {
    label: '⚠ Flagged',
    bg: 'rgba(180,60,60,0.07)',
    border: 'rgba(180,60,60,0.25)',
    color: 'var(--color-status-err)',
  },
  rejected: {
    label: '✗ Rejected',
    bg: 'rgba(180,60,60,0.07)',
    border: 'rgba(180,60,60,0.25)',
    color: 'var(--color-status-err)',
  },
} as const

export function GuestQualificationBadge({ status, required }: GuestQualificationBadgeProps) {
  // Not a qualification trip — show nothing meaningful
  if (!required && !status) {
    return (
      <span style={{ fontSize: 13, color: 'var(--color-ink-muted)' }}>
        —
      </span>
    )
  }

  // Qualification required but not yet submitted
  if (required && !status) {
    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          fontSize: 12,
          fontWeight: 600,
          padding: '3px 8px',
          borderRadius: 9999,
          background: 'rgba(181,150,89,0.1)',
          border: '1px solid rgba(181,150,89,0.3)',
          color: '#8a6c2a',
          whiteSpace: 'nowrap',
        }}
      >
        ⚠ Not submitted
      </span>
    )
  }

  if (!status) return null

  const config = BADGE_CONFIG[status]

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        fontSize: 12,
        fontWeight: 600,
        padding: '3px 8px',
        borderRadius: 9999,
        background: config.bg,
        border: `1px solid ${config.border}`,
        color: config.color,
        whiteSpace: 'nowrap',
      }}
    >
      {config.label}
    </span>
  )
}
