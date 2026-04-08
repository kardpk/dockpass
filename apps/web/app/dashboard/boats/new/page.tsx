import type { Metadata } from "next";
import { requireOperator } from "@/lib/security/auth";
import Link from "next/link";
import { BoatWizard } from "./BoatWizard";

export const metadata: Metadata = {
  title: "Add your boat — DockPass",
};

export default async function NewBoatPage() {
  const { operator, supabase } = await requireOperator();

  // Check boat limit
  const { count } = await supabase
    .from("boats")
    .select("id", { count: "exact", head: true })
    .eq("operator_id", operator!.id);

  const boatCount = count ?? 0;
  const maxBoats = operator!.max_boats;

  if (boatCount >= maxBoats) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-page">
        <div className="bg-white border border-border rounded-card p-large shadow-card text-center max-w-sm">
          <p className="text-[32px] mb-page">⚓</p>
          <h1 className="text-h2 text-dark-text">
            You&apos;ve reached your boat limit
          </h1>
          <p className="text-body text-grey-text mt-tight">
            Your {operator!.subscription_tier} plan includes{" "}
            {maxBoats} boat{maxBoats === 1 ? "" : "s"}.
            Upgrade to add more boats.
          </p>
          <Link
            href="/dashboard/billing"
            className="inline-flex items-center justify-center w-full h-[52px] mt-section bg-navy text-white font-medium rounded-btn hover:bg-mid-blue transition-colors"
          >
            Upgrade plan →
          </Link>
          <Link
            href="/dashboard"
            className="inline-block mt-standard text-label text-grey-text hover:text-dark-text transition-colors"
          >
            ← Back to dashboard
          </Link>
        </div>
      </div>
    );
  }

  return <BoatWizard />;
}
