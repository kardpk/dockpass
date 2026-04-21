import "server-only";

import { createServiceClient } from "@/lib/supabase/service";

/**
 * HIGH 6 fix: Structured audit logging for sensitive operations.
 * Non-blocking — audit failures never break the main flow.
 */

type AuditAction =
  | "guest_registered"
  | "guest_removed"
  | "waiver_signed"
  | "trip_created"
  | "trip_cancelled"
  | "trip_started"
  | "trip_ended"
  | "gdpr_deletion"
  | "operator_login"
  | "qr_scanned"
  | "addon_ordered"
  | "approval_granted"
  | "approval_denied"
  | "manifest_downloaded"
  | "uscg_manifest_downloaded"
  | "guest_boarded"
  | "review_submitted"
  | "boat_created"
  | "livery_briefing_verified"
  | "captain_created"
  | "captain_updated"
  | "captain_deactivated"
  | "captain_boat_linked"
  | "captain_boat_unlinked"
  | "crew_assigned"
  | "crew_removed"
  | "captain_notes_updated"
  | "head_count_confirmed"
  | "trip_reclassified"
  | "safety_briefing_confirmed"
  | "boat_qr_downloaded"
  // Phase 4B: FareHarbor integration + fleet operations
  | "webhook_received"
  | "trip_auto_created"
  | "integration_created"
  | "integration_updated"
  | "property_code_applied"
  | "fulfillment_advanced"
  // Phase 4A: qualification
  | "qualification_submitted"
  | "qualification_reviewed"
  // Phase 4C: addon revenue, multi-day, property codes
  | "addon_order_payment_captured"
  | "addon_created"
  | "addon_updated"
  | "multi_day_check_in"
  | "multi_day_check_out"
  | "stripe_connect_linked"
  | "property_code_created"
  // Phase 4E: condition photos, return inspection
  | "condition_photo_upload"
  | "return_inspection"
  | "guest_qualified";



interface AuditParams {
  action: AuditAction;
  operatorId?: string;
  actorType: "operator" | "captain" | "guest" | "system";
  actorIdentifier: string;
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
        actor_type: params.actorType,
        actor_identifier: params.actorIdentifier,
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
