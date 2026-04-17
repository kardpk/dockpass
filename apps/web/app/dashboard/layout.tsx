import { requireOperator } from "@/lib/security/auth";
import { BottomNav } from "@/components/dashboard/BottomNav";
import { TopBar } from "@/components/dashboard/TopBar";
import { DashboardNotifications } from "@/components/dashboard/DashboardNotifications";
import { AlertTriangle } from "lucide-react";

function getTrialDaysRemaining(trialEndsAt: string | null): number | null {
  if (!trialEndsAt) return null;
  const end = new Date(trialEndsAt);
  const now = new Date();
  const days = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return days;
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { operator } = await requireOperator();

  const operatorName = operator?.full_name ?? "Operator";

  const trialDays =
    operator?.subscription_status === "trial"
      ? getTrialDaysRemaining(operator?.trial_ends_at ?? null)
      : null;

  const showTrialBanner = trialDays !== null && trialDays <= 7;

  return (
    <div className="min-h-screen" style={{ background: "var(--color-paper)" }}>
      {/* Navy top bar — all viewports */}
      <TopBar operatorName={operatorName} operatorId={operator.id} />

      {/* Main content — centered, max-width for iPhone/iPad */}
      <main className="max-w-[768px] mx-auto pb-[72px]">
        {/* Realtime notification toasts */}
        <DashboardNotifications operatorId={operator.id} />

        {/* Trial expiry banner — .alert--warn pattern */}
        {showTrialBanner && (
          <div style={{ padding: "var(--s-4) var(--s-4) 0" }}>
            <div className="alert alert--warn">
              <AlertTriangle size={18} strokeWidth={2} aria-hidden="true" />
              <div className="alert__body">
                <strong style={{ fontSize: "var(--t-body-sm)" }}>Trial Ending</strong>
                <p style={{ margin: "var(--s-1) 0 0", fontSize: "var(--t-body-md)", color: "var(--color-ink)" }}>
                  Your free trial ends in{" "}
                  <strong>
                    {trialDays <= 0 ? "less than a day" : `${trialDays} day${trialDays === 1 ? "" : "s"}`}
                  </strong>.{" "}
                  <a
                    href="/dashboard/billing"
                    className="editorial-link"
                    style={{ display: "inline-flex" }}
                  >
                    Upgrade now
                  </a>
                </p>
              </div>
            </div>
          </div>
        )}

        {children}
      </main>

      {/* Bottom navigation — all viewports */}
      <BottomNav />
    </div>
  );
}
