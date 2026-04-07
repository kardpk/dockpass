import "server-only";

import { createServiceClient } from "@/lib/supabase/service";

/**
 * HIGH 6 fix: Structured audit logging for sensitive operations.
 * Non-blocking — audit failures never break the main flow.
 */

type AuditAction =
  | "guest_registered"
  | "waiver_signed"
  | "trip_started"
  | "trip_ended"
  | "gdpr_deletion"
  | "operator_login"
  | "qr_scanned"
  | "addon_ordered"
  | "approval_granted"
  | "approval_denied";

interface AuditParams {
  action: AuditAction;
  operatorId?: string;
  entityType: string;
  entityId: string;
  changes?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

export function auditLog(params: AuditParams): void {
  // Fire-and-forget — never block the main flow
  void (async () => {
    try {
      const supabase = createServiceClient();
      await supabase.from("audit_log").insert({
        action: params.action,
        operator_id: params.operatorId ?? null,
        entity_type: params.entityType,
        entity_id: params.entityId,
        changes: params.changes ?? {},
        ip_address: params.ipAddress ?? null,
        user_agent: params.userAgent?.slice(0, 500) ?? null,
      });
    } catch (err: unknown) {
      console.error("[audit] failed to log:", err);
      // Never throw — audit is observability, not functionality
    }
  })();
}
