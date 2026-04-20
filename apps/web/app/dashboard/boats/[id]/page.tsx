import { requireOperator } from "@/lib/security/auth";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  Ship, MapPin, Users, Calendar, Anchor, ChevronLeft,
  UserCog, Check, TriangleAlert, ChevronRight, Car,
  Shield, ClipboardList, BookOpen, Plus, QrCode,
} from "lucide-react";
import { BoatQRSection } from "./BoatQRSection";
import { BoatDetailClient } from "./BoatDetailClient";

interface BoatDetailPageProps {
  params: Promise<{ id: string }>;
}

function parseItems(text: string | null | undefined): string[] {
  if (!text) return [];
  const byLine = text.split(/\n+/).map((s) => s.replace(/^\d+\.\s*/, "").trim()).filter(Boolean);
  if (byLine.length > 1) return byLine;
  return text.split(/\.\s+/).map((s) => s.replace(/^\d+\.\s*/, "").trim()).filter(Boolean);
}

function formatLabel(raw: string | null | undefined) {
  return (raw ?? "").replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Reusable section kicker — soft 1px line-soft hairline, --ink-muted label (§3 DASHBOARD_COSMETIC_RULES) */
function SectionKicker({
  icon: Icon,
  label,
  right,
}: {
  icon: React.ComponentType<{ size?: number; strokeWidth?: number; style?: React.CSSProperties }>;
  label: string;
  right?: React.ReactNode;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: "var(--s-3)",
        paddingBottom: "var(--s-3)",
        borderBottom: "1px solid var(--color-line-soft)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "var(--s-2)" }}>
        <Icon size={12} strokeWidth={2} style={{ color: "var(--color-ink-muted)" }} />
        <span
          className="font-mono"
          style={{
            fontSize: "var(--t-mono-xs)",
            fontWeight: 600,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "var(--color-ink-muted)",
          }}
        >
          {label}
        </span>
      </div>
      {right}
    </div>
  );
}

export default async function BoatDetailPage({ params }: BoatDetailPageProps) {
  const { id } = await params;
  const { operator, supabase } = await requireOperator();

  const { data: boat } = await supabase
    .from("boats")
    .select("*")
    .eq("id", id)
    .eq("operator_id", operator.id)
    .single();

  if (!boat) return notFound();

  const { count: tripCount } = await supabase
    .from("trips")
    .select("id", { count: "exact", head: true })
    .eq("boat_id", id);

  const { data: firstPhoto } = await supabase
    .from("boat_photos")
    .select("url")
    .eq("boat_id", id)
    .order("display_order", { ascending: true })
    .limit(1)
    .single();

  const { count: photoCount } = await supabase
    .from("boat_photos")
    .select("id", { count: "exact", head: true })
    .eq("boat_id", id);

  const { data: linkedCaptains } = await supabase
    .from("captain_boat_links")
    .select("captain:captains(id, full_name, license_type, photo_url, languages, years_experience, is_default)")
    .eq("boat_id", id)
    .limit(4);

  const primaryCaptain = (linkedCaptains?.[0] as any)?.captain ?? null;

  // Separate count for the readiness check (doesn't depend on the join succeeding)
  const { count: captainLinkCount } = await supabase
    .from("captain_boat_links")
    .select("captain_id", { count: "exact", head: true })
    .eq("boat_id", id);

  const complianceScore = boat.compliance_score ?? 0;
  const isCompliant = complianceScore >= 90;

  const onboardInfo = (boat.onboard_info as Record<string, unknown>) ?? {};
  const standardRules: string[] = Array.isArray(onboardInfo.standardRules)
    ? (onboardInfo.standardRules as string[])
    : Array.isArray(boat.standard_rules) ? boat.standard_rules : [];
  const dos: string[] = Array.isArray(onboardInfo.dos)
    ? (onboardInfo.dos as string[])
    : Array.isArray(boat.dos) ? boat.dos : [];
  const donts: string[] = Array.isArray(onboardInfo.donts)
    ? (onboardInfo.donts as string[])
    : Array.isArray(boat.donts) ? boat.donts : [];
  const rulesFromText = standardRules.length === 0 ? parseItems(boat.house_rules) : standardRules;
  const bringItems = parseItems(boat.what_to_bring);
  const dontBringItems = parseItems(boat.what_not_to_bring);

  const readinessChecks: { label: string; ok: boolean; hint?: string; href?: string }[] = [
    {
      label: "Boat photos uploaded",
      ok: (photoCount ?? 0) >= 1,
      hint: "Add at least one photo so guests recognise the vessel",
      href: `/dashboard/boats/${id}/edit?step=photos`,
    },
    {
      label: "Waiver configured",
      ok: !!(boat.waiver_text || boat.waiver_url),
      hint: "Attach a waiver guests must sign before boarding",
      href: `/dashboard/boats/${id}/edit?step=waiver`,
    },
    {
      label: "Safety briefing cards set",
      ok: !!(boat.safety_cards && (boat.safety_cards as unknown[]).length > 0),
      hint: "Add vessel-specific safety cards for guest swipe-through",
      href: `/dashboard/boats/${id}/edit?step=safety`,
    },
    {
      label: "Captain assigned",
      ok: (captainLinkCount ?? 0) > 0 || !!boat.captain_name,
      hint: "Link a captain so the operator snapshot SMS can be sent",
      href: `/dashboard/captains`,
    },
    {
      label: "Home marina set",
      ok: !!boat.marina_name,
      hint: "Set the marina so guests know where to board",
      href: `/dashboard/boats/${id}/edit?step=location`,
    },
  ];
  const readinessScore = readinessChecks.filter((c) => c.ok).length;

  const typeLabel = formatLabel(boat.boat_type);
  const charterLabel = formatLabel(boat.charter_type);

  return (
    <div style={{ maxWidth: 660, margin: "0 auto", paddingBottom: 144 }}>

      {/* ── COMPACT HERO HEADER ──────────────────────────────── */}
      <div style={{ padding: "var(--s-6) var(--s-5) 0" }}>

        {/* Back breadcrumb */}
        <Link
          href="/dashboard/boats"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            fontFamily: "var(--mono)",
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "var(--color-ink-muted)",
            textDecoration: "none",
            marginBottom: "var(--s-4)",
          }}
        >
          <ChevronLeft size={12} strokeWidth={2.5} />
          All boats
        </Link>

        {/* Vessel name + status inline */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "var(--s-3)" }}>
          <h1
            className="font-display"
            style={{
              fontSize: "clamp(28px, 5vw, 36px)",
              fontWeight: 500,
              letterSpacing: "-0.03em",
              color: "var(--color-ink)",
              lineHeight: 1.0,
            }}
          >
            {boat.boat_name}
          </h1>
          <span
            className={boat.is_active ? "pill pill--ok" : "pill pill--warn"}
            style={{ fontSize: "var(--t-mono-xs)", flexShrink: 0, marginTop: 6 }}
          >
            {boat.is_active ? "Active" : "Draft"}
          </span>
        </div>

        {/* Type kicker */}
        <p
          className="font-mono"
          style={{
            fontSize: "var(--t-mono-xs)",
            fontWeight: 600,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "var(--color-ink-muted)",
            marginTop: 6,
          }}
        >
          {typeLabel}{charterLabel ? ` · ${charterLabel}` : ""}
        </p>

        {/* Photo strip — narrow, if photo exists */}
        {firstPhoto?.url && (
          <div
            style={{
              marginTop: "var(--s-4)",
              height: 110,
              borderRadius: "var(--r-1)",
              overflow: "hidden",
              position: "relative",
              border: "1px solid var(--color-line-soft)",
            }}
          >
            <Image
              src={firstPhoto.url}
              alt={boat.boat_name}
              fill
              className="object-cover"
              unoptimized
            />
          </div>
        )}

        {/* Stat chips */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "var(--s-1)",
            marginTop: "var(--s-4)",
            marginBottom: "var(--s-6)",
          }}
        >
          {[
            { Icon: Users,    value: boat.max_capacity, label: "guests",  brass: false, show: true },
            { Icon: Calendar, value: tripCount ?? 0,    label: "trips",   brass: false, show: (tripCount ?? 0) >= 1 },
            {
              Icon: Anchor,
              value: (boat.state_code ?? "").toUpperCase() === "FL" ? "SB 606" : (boat.state_code ?? ""),
              label: (boat.state_code ?? "").toUpperCase() === "FL" ? "livery law" : "state",
              brass: (boat.state_code ?? "").toUpperCase() === "FL",
              show: !!boat.state_code,
            },
            ...(boat.length_ft ? [{ Icon: Ship, value: `${boat.length_ft}ft`, label: "length", brass: false, show: true }] : []),
          ]
            .filter((c) => c.show)
            .map(({ Icon, value, label, brass }) => (
              <div
                key={label}
                style={{
                  flexShrink: 0,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  padding: "4px 10px",
                  borderRadius: 9999,
                  border: brass ? "1px solid var(--color-brass)" : "1px solid var(--color-line)",
                  background: brass ? "rgba(200,161,74,0.1)" : "var(--color-bone)",
                }}
              >
                <Icon size={12} strokeWidth={1.5} style={{ color: brass ? "var(--color-brass)" : "var(--color-ink-muted)" }} />
                <span style={{ fontSize: 13, fontWeight: 600, color: brass ? "var(--color-brass-deep, #9E7D2E)" : "var(--color-ink)" }}>
                  {value}
                </span>
                <span className="mono" style={{ fontSize: 11, color: brass ? "var(--color-brass)" : "var(--color-ink-muted)" }}>
                  {label}
                </span>
              </div>
            ))}
        </div>
      </div>

      {/* ── BODY SECTIONS ─────────────────────────────────────── */}
      <div style={{ padding: "0 var(--s-5)" }}>

        {/* ── LOCATION ── */}
        {boat.marina_name && (
          <section style={{ marginBottom: "var(--s-6)" }}>
            <SectionKicker icon={MapPin} label="Location" />
            <div className="tile" style={{ padding: 0, overflow: "hidden" }}>
              <div style={{ padding: "var(--s-4)", display: "flex", alignItems: "flex-start", gap: "var(--s-3)" }}>
                <MapPin size={16} strokeWidth={1.5} style={{ color: "var(--color-ink-muted)", flexShrink: 0, marginTop: 2 }} />
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: 600, fontSize: "15px", color: "var(--color-ink)" }}>
                    {boat.marina_name}
                    {boat.slip_number && (
                      <span className="pill pill--ok" style={{ marginLeft: "var(--s-2)", fontSize: "var(--t-mono-xs)" }}>
                        Slip {boat.slip_number}
                      </span>
                    )}
                  </p>
                  {boat.marina_address && (
                    <p className="mono" style={{ fontSize: "var(--t-mono-xs)", color: "var(--color-ink-muted)", marginTop: 2 }}>
                      {boat.marina_address}
                    </p>
                  )}
                </div>
              </div>
              {boat.parking_instructions && (
                <>
                  <div style={{ height: 1, background: "var(--color-line-soft)" }} />
                  <div style={{ padding: "var(--s-3) var(--s-4)", display: "flex", alignItems: "flex-start", gap: "var(--s-3)" }}>
                    <Car size={14} strokeWidth={1.5} style={{ color: "var(--color-ink-muted)", flexShrink: 0, marginTop: 2 }} />
                    <p style={{ fontSize: "var(--t-body-sm)", color: "var(--color-ink)" }}>{boat.parking_instructions}</p>
                  </div>
                </>
              )}
            </div>
          </section>
        )}

        {/* ── CAPTAIN & CREW ── */}
        {(primaryCaptain || boat.captain_name) && (
          <section style={{ marginBottom: "var(--s-6)" }}>
            <SectionKicker icon={UserCog} label="Captain & Crew" />
            <div className="tile" style={{ padding: "var(--s-4)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "var(--s-3)" }}>
                <div
                  style={{
                    width: 48, height: 48, borderRadius: "50%", flexShrink: 0,
                    background: "var(--color-bone)",
                    border: "1px solid var(--color-line)",
                    overflow: "hidden",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}
                >
                  {primaryCaptain?.photo_url ? (
                    <Image
                      src={primaryCaptain.photo_url}
                      alt={primaryCaptain.full_name}
                      width={48}
                      height={48}
                      className="object-cover w-full h-full"
                      unoptimized
                    />
                  ) : (
                    <UserCog size={22} strokeWidth={1.5} style={{ color: "var(--color-ink-muted)" }} />
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p className="font-display" style={{ fontWeight: 500, fontSize: "17px", color: "var(--color-ink)", letterSpacing: "-0.01em" }}>
                    {primaryCaptain?.full_name ?? boat.captain_name}
                  </p>
                  <div style={{ display: "flex", alignItems: "center", gap: "var(--s-2)", marginTop: 3, flexWrap: "wrap" }}>
                    {(primaryCaptain?.license_type ?? boat.captain_license) && (
                      <span className="mono" style={{ fontSize: "var(--t-mono-xs)", color: "var(--color-ink-muted)" }}>
                        {primaryCaptain?.license_type ?? boat.captain_license}
                      </span>
                    )}
                    {primaryCaptain?.years_experience && (
                      <span className="mono" style={{ fontSize: "var(--t-mono-xs)", color: "var(--color-ink-muted)" }}>
                        · {primaryCaptain.years_experience} yrs exp
                      </span>
                    )}
                  </div>
                  {Array.isArray(primaryCaptain?.languages) && primaryCaptain.languages.length > 0 && (
                    <div style={{ display: "flex", gap: "var(--s-1)", marginTop: "var(--s-2)", flexWrap: "wrap" }}>
                      {primaryCaptain.languages.map((lang: string) => (
                        <span key={lang} className="pill" style={{ fontSize: "var(--t-mono-xs)", textTransform: "uppercase" }}>
                          {lang}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div style={{ marginTop: "var(--s-3)", paddingTop: "var(--s-3)", borderTop: "1px solid var(--color-line-soft)" }}>
                <Link href="/dashboard/captains" className="btn btn--ghost btn--sm" style={{ gap: "var(--s-1)" }}>
                  Manage crew <ChevronRight size={13} strokeWidth={2} />
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* ── TRIP READINESS ── */}
        <section style={{ marginBottom: "var(--s-6)" }}>
          <SectionKicker
            icon={Shield}
            label="Trip Readiness"
            right={
              <span
                className={readinessScore === readinessChecks.length ? "pill pill--ok" : "pill pill--warn"}
                style={{ fontSize: "var(--t-mono-xs)" }}
              >
                {readinessScore}/{readinessChecks.length}
              </span>
            }
          />
          <div className="tile" style={{ padding: 0, overflow: "hidden" }}>
            {readinessChecks.map((check, i) => {
              const isLast = i === readinessChecks.length - 1;
              return (
                <div
                  key={check.label}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "var(--s-3)",
                    padding: "var(--s-3) var(--s-4)",
                    borderBottom: isLast ? "none" : "1px solid var(--color-line-soft)",
                    background: check.ok ? "var(--color-paper)" : "rgba(184,136,42,0.03)",
                  }}
                >
                  <div style={{ flexShrink: 0 }}>
                    {check.ok ? (
                      <Check size={15} strokeWidth={2} style={{ color: "var(--color-status-ok)" }} />
                    ) : (
                      <TriangleAlert size={15} strokeWidth={2} style={{ color: "var(--color-status-warn)" }} />
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: "var(--t-body-sm)", fontWeight: 500, color: "var(--color-ink)" }}>{check.label}</p>
                    {!check.ok && check.hint && (
                      <p className="mono" style={{ fontSize: "var(--t-mono-xs)", color: "var(--color-ink-muted)", marginTop: 2 }}>{check.hint}</p>
                    )}
                  </div>
                  {!check.ok && check.href && (
                    <Link href={check.href} className="btn btn--outline btn--sm" style={{ flexShrink: 0, height: 28, padding: "0 10px", fontSize: "var(--t-mono-xs)" }}>Fix</Link>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* ── COMPLIANCE SCORE ── */}
        <section style={{ marginBottom: "var(--s-6)" }}>
          <SectionKicker icon={Shield} label="Compliance" />
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "var(--s-3) var(--s-4)", background: "var(--color-bone)", border: "1px solid var(--color-line-soft)", borderRadius: "var(--r-1)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "var(--s-2)" }}>
              {isCompliant ? (
                <Check size={16} strokeWidth={2} style={{ color: "var(--color-status-ok)" }} />
              ) : (
                <TriangleAlert size={16} strokeWidth={2} style={{ color: complianceScore >= 70 ? "var(--color-status-warn)" : "var(--color-status-error)" }} />
              )}
              <div>
                <p className="font-display" style={{ fontSize: "var(--t-body-sm)", fontWeight: 500, color: "var(--color-ink)" }}>Compliance score</p>
                <p className="mono" style={{ fontSize: "10px", letterSpacing: "0.05em", marginTop: 2, color: complianceScore >= 70 ? (isCompliant ? "var(--color-status-ok)" : "var(--color-status-warn)") : "var(--color-status-error)" }}>
                  {complianceScore >= 90 ? "Excellent" : complianceScore >= 70 ? "Needs attention" : "Incomplete setup"}
                </p>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "var(--s-2)" }}>
              <span className="mono" style={{ fontSize: "12px", letterSpacing: "0.1em", color: complianceScore >= 70 ? (isCompliant ? "var(--color-status-ok)" : "var(--color-status-warn)") : "var(--color-status-error)" }}>
                {`[${"█".repeat(Math.round(complianceScore / 10))}${"░".repeat(10 - Math.round(complianceScore / 10))}]`} {complianceScore}%
              </span>
              <Link href={`/dashboard/boats/${boat.id}/edit`} className="btn btn--outline btn--sm" style={{ height: 28, padding: "0 10px", fontSize: "var(--t-mono-xs)", letterSpacing: "0.05em" }}>Edit</Link>
            </div>
          </div>
        </section>

        {/* ── HOUSE RULES ── */}
        {(rulesFromText.length > 0 || dos.length > 0 || donts.length > 0) && (
          <section style={{ marginBottom: "var(--s-6)" }}>
            <SectionKicker icon={BookOpen} label="House Rules" />
            <BoatDetailClient rules={rulesFromText} dos={dos} donts={donts} />
          </section>
        )}

        {/* ── WHAT TO BRING ── */}
        {(bringItems.length > 0 || dontBringItems.length > 0) && (
          <section style={{ marginBottom: "var(--s-6)" }}>
            <SectionKicker icon={ClipboardList} label="What to Bring" />
            <div className="tile" style={{ padding: "var(--s-4)", overflow: "hidden" }}>
              {bringItems.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--s-2)" }}>
                  {bringItems.map((item, i) => (
                    <span
                      key={i}
                      style={{
                        display: "inline-block",
                        padding: "4px 12px",
                        borderRadius: 9999,
                        fontSize: 13,
                        lineHeight: 1.4,
                        wordBreak: "break-word",
                        maxWidth: "100%",
                        background: i % 2 === 0 ? "var(--color-bone)" : "var(--color-ink)",
                        color: i % 2 === 0 ? "var(--color-ink)" : "var(--color-paper)",
                        border: i % 2 === 0 ? "1px solid var(--color-line)" : "1px solid var(--color-ink)",
                      }}
                    >
                      {item}
                    </span>
                  ))}
                </div>
              )}
              {dontBringItems.length > 0 && (
                <>
                  <p className="mono" style={{ fontSize: "var(--t-mono-xs)", color: "var(--color-ink-muted)", margin: "var(--s-4) 0 var(--s-2)", textTransform: "uppercase" }}>
                    Leave at home
                  </p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--s-2)" }}>
                    {dontBringItems.map((item, i) => (
                      <span
                        key={i}
                        style={{
                          display: "inline-block",
                          padding: "4px 12px",
                          borderRadius: 9999,
                          fontSize: 13,
                          lineHeight: 1.4,
                          wordBreak: "break-word",
                          maxWidth: "100%",
                          background: "rgba(var(--color-status-err-rgb,180,60,60),0.08)",
                          color: "var(--color-status-err)",
                          border: "1px solid rgba(var(--color-status-err-rgb,180,60,60),0.2)",
                        }}
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </>
              )}
            </div>
          </section>
        )}

        {/* ── BOARDING LINK / QR ── */}
        <section style={{ marginBottom: "var(--s-6)" }}>
          <SectionKicker icon={QrCode} label="Share Boarding Link" />
          <BoatQRSection
            boatId={boat.id as string}
            boatName={boat.boat_name as string}
            publicSlug={(boat.public_slug as string) ?? ""}
            shortBoardToken={(boat.short_board_token as string | null) ?? null}
          />
        </section>

      </div>

      {/* ── STICKY FOOTER CTAs ─────────────────────────────── */}
      <div
        style={{
          position: "fixed",
          bottom: 56,
          left: 0,
          right: 0,
          zIndex: 40,
          background: "var(--color-paper)",
          borderTop: "1px solid var(--color-line-soft)",
          padding: "var(--s-3) var(--s-5)",
          display: "flex",
          gap: "var(--s-2)",
          maxWidth: 660,
          marginLeft: "auto",
          marginRight: "auto",
        }}
      >
        {/* Primary CTA — rust, prominent */}
        <Link
          href={`/dashboard/trips/new?boatId=${boat.id}`}
          className="btn btn--rust"
          style={{ flex: 1, justifyContent: "center", height: 46, fontSize: "var(--t-body-sm)", fontWeight: 600 }}
        >
          <Plus size={14} strokeWidth={2.5} />
          New trip on {boat.boat_name}
        </Link>

        {/* Secondary — ghost, compact */}
        <Link
          href={`/dashboard/boats/${boat.id}/edit`}
          className="btn btn--ghost"
          style={{ height: 46, paddingInline: "var(--s-4)", fontSize: "var(--t-body-sm)", flexShrink: 0 }}
        >
          Edit
        </Link>
      </div>
    </div>
  );
}
