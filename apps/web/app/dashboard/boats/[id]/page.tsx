import { requireOperator } from "@/lib/security/auth";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  Ship, MapPin, Users, Calendar, Anchor, ChevronLeft,
  UserCog, Check, TriangleAlert, ChevronRight, Car,
  Shield, Package, ClipboardList, Camera, BookOpen,
} from "lucide-react";
import { BoatQRSection } from "./BoatQRSection";
import { BoatDetailClient } from "./BoatDetailClient";
import { TripReadinessModal } from "./TripReadinessModal";

interface BoatDetailPageProps {
  params: Promise<{ id: string }>;
}

// ── Parse a text blob into bullet items (newline or ". " separated) ──
function parseItems(text: string | null | undefined): string[] {
  if (!text) return [];
  // Try newline split first
  const byLine = text.split(/\n+/).map((s) => s.replace(/^\d+\.\s*/, "").trim()).filter(Boolean);
  if (byLine.length > 1) return byLine;
  // Fall back to sentence split
  return text.split(/\.\s+/).map((s) => s.replace(/^\d+\.\s*/, "").trim()).filter(Boolean);
}

// ── Boat type → display label ──
function formatLabel(raw: string | null | undefined) {
  return (raw ?? "").replace(/_/g, " ");
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

  // Trip count
  const { count: tripCount } = await supabase
    .from("trips")
    .select("id", { count: "exact", head: true })
    .eq("boat_id", id);

  // First boat photo
  const { data: firstPhoto } = await supabase
    .from("boat_photos")
    .select("url")
    .eq("boat_id", id)
    .order("display_order", { ascending: true })
    .limit(1)
    .single();

  // Boat photo count for readiness check
  const { count: photoCount } = await supabase
    .from("boat_photos")
    .select("id", { count: "exact", head: true })
    .eq("boat_id", id);

  // Linked captains via roster
  const { data: linkedCaptains } = await supabase
    .from("captain_boat_links")
    .select("captain:captains(id, full_name, license_type, captain_photo_url, captain_languages, captain_years_exp, is_default)")
    .eq("boat_id", id)
    .limit(4);

  const primaryCaptain = (linkedCaptains?.[0] as any)?.captain ?? null;

  const complianceScore = boat.compliance_score ?? 0;
  const isCompliant = complianceScore >= 90;
  
  // ── Parse structured rules ──
  // ── Parse structured rules — stored in onboard_info JSONB ──
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
  // Fallback: parse house_rules text
  const rulesFromText = standardRules.length === 0 ? parseItems(boat.house_rules) : standardRules;

  // ── Parse what to bring ──
  const bringItems = parseItems(boat.what_to_bring);
  const dontBringItems = parseItems(boat.what_not_to_bring);

  return (
    <div className="max-w-[640px] mx-auto pb-[144px]">

      {/* ── HERO ── */}
      <div style={{ position: "relative", height: 160, background: "var(--color-ink)", overflow: "hidden" }}>
        {firstPhoto?.url ? (
          <Image
            src={firstPhoto.url}
            alt={boat.boat_name}
            fill
            className="object-cover"
            unoptimized
          />
        ) : (
          <div
            style={{
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "linear-gradient(135deg, var(--color-ink) 0%, #1e3a52 100%)",
            }}
          >
            <Ship size={56} strokeWidth={1} style={{ color: "rgba(232,225,210,0.15)" }} />
          </div>
        )}
        {/* Bottom gradient overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(to top, rgba(11,30,45,0.75) 0%, transparent 55%)",
          }}
        />
        {/* Back link */}
        <Link
          href="/dashboard/boats"
          style={{
            position: "absolute",
            top: "var(--s-4)",
            left: "var(--s-4)",
            display: "inline-flex",
            alignItems: "center",
            gap: "var(--s-1)",
            padding: "var(--s-1) var(--s-3)",
            borderRadius: 9999,
            background: "rgba(11,30,45,0.55)",
            backdropFilter: "blur(8px)",
            color: "var(--color-paper)",
            fontSize: "var(--t-body-sm)",
            fontWeight: 500,
            textDecoration: "none",
          }}
        >
          <ChevronLeft size={14} strokeWidth={2} />
          All boats
        </Link>
        {/* Status pill */}
        <span
          className={boat.is_active ? "pill pill--ok" : "pill pill--warn"}
          style={{
            position: "absolute",
            top: "var(--s-4)",
            right: "var(--s-4)",
            fontSize: "var(--t-mono-xs)",
          }}
        >
          {boat.is_active ? "Active" : "Draft"}
        </span>
        {/* Name + type overlaid at bottom */}
        <div
          style={{
            position: "absolute",
            bottom: "var(--s-4)",
            left: "var(--s-4)",
            right: "var(--s-4)",
          }}
        >
          <h1
            className="font-display"
            style={{
              fontSize: "clamp(1.75rem, 5vw, 2.4rem)",
              fontWeight: 600,
              color: "var(--color-paper)",
              lineHeight: 1.05,
              textShadow: "0 1px 8px rgba(0,0,0,0.35)",
            }}
          >
            {boat.boat_name}
          </h1>
          <p
            className="mono"
            style={{ fontSize: "var(--t-mono-xs)", color: "rgba(232,225,210,0.7)", marginTop: 2 }}
          >
            {formatLabel(boat.boat_type)} · {formatLabel(boat.charter_type)}
            {boat.length_ft ? ` · ${boat.length_ft}ft` : ""}
          </p>
        </div>
      </div>

      <div style={{ padding: "var(--s-5) var(--s-5) 0" }}>

        {/* ── STAT STRIP ── */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "var(--s-1)",
            marginBottom: "var(--s-5)",
          }}
        >
          {[
            // Guests chip — always shown
            { Icon: Users, value: boat.max_capacity, label: "guests", brass: false, show: true },
            // Trips chip — only shown when operator has run at least 1 trip
            { Icon: Calendar, value: tripCount ?? 0, label: "trips", brass: false, show: (tripCount ?? 0) >= 1 },
            // State chip — "SB 606" for FL boats (compliance context), raw state for others
            {
              Icon: Anchor,
              value: (boat.state_code ?? "").toUpperCase() === "FL" ? "SB 606" : (boat.state_code ?? "—"),
              label: (boat.state_code ?? "").toUpperCase() === "FL" ? "livery law" : "state",
              brass: (boat.state_code ?? "").toUpperCase() === "FL",
              show: true,
            },
            ...(boat.length_ft ? [{ Icon: Ship, value: `${boat.length_ft}ft`, label: "length", brass: false, show: true }] : []),
          ]
            .filter((chip) => chip.show)
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

        {/* ── LOCATION ── */}
        {boat.marina_name && (
          <section style={{ marginBottom: "var(--s-5)" }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--s-2)', marginBottom: 'var(--s-2)', paddingBottom: 'var(--s-2)', borderBottom: '2px solid var(--color-ink)' }}>
              <MapPin size={14} strokeWidth={2} style={{ color: 'var(--color-ink)' }} />
              <span className="font-mono" style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-ink)' }}>Location</span>
            </div>
            <div className="tile" style={{ padding: 0, overflow: "hidden", borderLeft: '4px solid var(--color-ink)' }}>
              <div style={{ padding: "var(--s-4)", display: "flex", alignItems: "flex-start", gap: "var(--s-3)" }}>
                <MapPin size={16} strokeWidth={1.5} style={{ color: "var(--color-ink-muted)", flexShrink: 0, marginTop: 2 }} />
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: 600, fontSize: '15px', color: "var(--color-ink)" }}>
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
                    <p style={{ fontSize: "var(--t-body-sm)", color: "var(--color-ink)" }}>
                      {boat.parking_instructions}
                    </p>
                  </div>
                </>
              )}
            </div>
          </section>
        )}

        {/* ── CAPTAIN & CREW ── */}
        {(primaryCaptain || boat.captain_name) && (
          <section style={{ marginBottom: "var(--s-5)" }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--s-2)', marginBottom: 'var(--s-2)', paddingBottom: 'var(--s-2)', borderBottom: '2px solid var(--color-ink)' }}>
              <UserCog size={14} strokeWidth={2} style={{ color: 'var(--color-ink)' }} />
              <span className="font-mono" style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-ink)' }}>Captain & Crew</span>
            </div>
            <div className="tile" style={{ padding: "var(--s-4)", borderLeft: '4px solid var(--color-ink)' }}>
              <div style={{ display: "flex", alignItems: "center", gap: "var(--s-3)" }}>
                {/* Captain photo or avatar */}
                <div
                  style={{
                    width: 48, height: 48, borderRadius: "50%", flexShrink: 0,
                    background: "var(--color-bone)",
                    border: "1px solid var(--color-line)",
                    overflow: "hidden",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}
                >
                  {primaryCaptain?.captain_photo_url ? (
                    <Image
                      src={primaryCaptain.captain_photo_url}
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
                  <p className="font-display" style={{ fontWeight: 500, fontSize: '17px', color: "var(--color-ink)", letterSpacing: '-0.01em' }}>
                    {primaryCaptain?.full_name ?? boat.captain_name}
                  </p>
                  <div style={{ display: "flex", alignItems: "center", gap: "var(--s-2)", marginTop: 3, flexWrap: "wrap" }}>
                    {(primaryCaptain?.license_type ?? boat.captain_license) && (
                      <span className="mono" style={{ fontSize: "var(--t-mono-xs)", color: "var(--color-ink-muted)" }}>
                        {primaryCaptain?.license_type ?? boat.captain_license}
                      </span>
                    )}
                    {primaryCaptain?.captain_years_exp && (
                      <span className="mono" style={{ fontSize: "var(--t-mono-xs)", color: "var(--color-ink-muted)" }}>
                        · {primaryCaptain.captain_years_exp} yrs exp
                      </span>
                    )}
                  </div>
                  {/* Language pills */}
                  {Array.isArray(primaryCaptain?.captain_languages) && primaryCaptain.captain_languages.length > 0 && (
                    <div style={{ display: "flex", gap: "var(--s-1)", marginTop: "var(--s-2)", flexWrap: "wrap" }}>
                      {primaryCaptain.captain_languages.map((lang: string) => (
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
        <section style={{ marginBottom: "var(--s-5)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "var(--s-2)", paddingBottom: "var(--s-2)", borderBottom: "2px solid var(--color-ink)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "var(--s-2)" }}>
              <Shield size={14} strokeWidth={2} style={{ color: "var(--color-ink)" }} />
              <span className="font-mono" style={{ fontSize: "12px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--color-ink)" }}>Trip Readiness</span>
            </div>
            <span
              className={readinessScore === readinessChecks.length ? "pill pill--ok" : "pill pill--warn"}
              style={{ fontSize: "var(--t-mono-xs)" }}
            >
              {readinessScore}/{readinessChecks.length}
            </span>
          </div>
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
        <section style={{ marginBottom: "var(--s-5)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--s-2)", marginBottom: "var(--s-2)", paddingBottom: "var(--s-2)", borderBottom: "2px solid var(--color-ink)" }}>
            <Shield size={14} strokeWidth={2} style={{ color: "var(--color-ink)" }} />
            <span className="font-mono" style={{ fontSize: "12px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--color-ink)" }}>Compliance</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "var(--s-3) var(--s-4)", background: "var(--color-bone)", border: "1px solid var(--color-line-soft)", borderRadius: 4, marginTop: "var(--s-2)" }}>
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
                {`[${'█'.repeat(Math.round(complianceScore / 10))}${'░'.repeat(10 - Math.round(complianceScore / 10))}]`} {complianceScore}%
              </span>
              <Link href={`/dashboard/boats/${boat.id}/edit`} className="btn btn--outline btn--sm" style={{ height: 28, padding: "0 10px", fontSize: "var(--t-mono-xs)", letterSpacing: "0.05em" }}>Edit</Link>
            </div>
          </div>
        </section>

        {/* ── HOUSE RULES ── */}
        {(rulesFromText.length > 0 || dos.length > 0 || donts.length > 0) && (
          <section style={{ marginBottom: "var(--s-5)" }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--s-2)', marginBottom: 'var(--s-2)', paddingBottom: 'var(--s-2)', borderBottom: '2px solid var(--color-ink)' }}>
              <BookOpen size={14} strokeWidth={2} style={{ color: 'var(--color-ink)' }} />
              <span className="font-mono" style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-ink)' }}>House Rules</span>
            </div>
            <BoatDetailClient
              rules={rulesFromText}
              dos={dos}
              donts={donts}
            />
          </section>
        )}

        {/* ── WHAT TO BRING ── */}
        {(bringItems.length > 0 || dontBringItems.length > 0) && (
          <section style={{ marginBottom: "var(--s-5)" }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--s-2)', marginBottom: 'var(--s-2)', paddingBottom: 'var(--s-2)', borderBottom: '2px solid var(--color-ink)' }}>
              <ClipboardList size={14} strokeWidth={2} style={{ color: 'var(--color-ink)' }} />
              <span className="font-mono" style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-ink)' }}>What to Bring</span>
            </div>
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
                        // Alternate: even = bone/border, odd = ink/paper
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

        {/* ── QR / BOARDING LINK ── */}
        <section style={{ marginBottom: "var(--s-5)" }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--s-2)', marginBottom: 'var(--s-2)', paddingBottom: 'var(--s-2)', borderBottom: '2px solid var(--color-ink)' }}>
            <Anchor size={14} strokeWidth={2} style={{ color: 'var(--color-ink)' }} />
            <span className="font-mono" style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-ink)' }}>Boarding QR</span>
          </div>
          <BoatQRSection
            boatId={boat.id as string}
            boatName={boat.boat_name as string}
            publicSlug={(boat.public_slug as string) ?? ""}
            shortBoardToken={(boat.short_board_token as string | null) ?? null}
          />
        </section>

        {/* ── STICKY CTA FOOTER ── */}
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
            maxWidth: 640,
            marginLeft: "auto",
            marginRight: "auto",
          }}
        >
          <Link
            href={`/dashboard/boats/${boat.id}/edit`}
            className="btn btn--ghost"
            style={{ height: 48, paddingInline: "var(--s-4)", fontSize: "var(--t-body-sm)" }}
          >
            Edit boat setup
          </Link>
        </div>
      </div>
    </div>
  );
}
