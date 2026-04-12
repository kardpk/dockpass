"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { AnchorLoader } from "@/components/ui/AnchorLoader";
import { CheckCircle, AlertCircle } from "lucide-react";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [showPass, setShowPass] = useState(false);

  // Supabase sends the token in the URL hash after email callback
  useEffect(() => {
    const supabase = createClient();
    // On mount, exchange the hash tokens for a session
    supabase.auth.onAuthStateChange((event: string) => {
      if (event === "PASSWORD_RECOVERY") {
        // Session is now active — user can call updateUser
      }
    });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({
      password,
    });

    if (updateError) {
      setError(
        updateError.message === "Auth session missing!"
          ? "This reset link has expired. Please request a new one."
          : "Failed to reset password. Please try again."
      );
      setLoading(false);
      return;
    }

    setDone(true);
    setLoading(false);
  }

  if (done) {
    return (
      <div className="text-center">
        <div className="w-[48px] h-[48px] rounded-full bg-success-bg flex items-center justify-center mx-auto mb-page">
          <CheckCircle size={24} className="text-success-text" />
        </div>
        <h2 className="text-h2 text-dark-text">Password updated</h2>
        <p className="text-body text-grey-text mt-tight">
          Your password has been reset successfully.
          You can now sign in with your new password.
        </p>
        <Link
          href="/login?message=password_reset"
          className="inline-block mt-section w-full h-[52px] bg-navy text-white font-medium rounded-btn hover:bg-mid-blue transition-colors flex items-center justify-center"
        >
          Sign in →
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <h1 className="text-h1 text-dark-text">Set a new password</h1>
      <p className="text-body text-grey-text mt-tight">
        Choose a strong password for your account
      </p>

      {error && (
        <div className="mt-standard flex items-start gap-tight p-standard bg-error-bg rounded-chip">
          <AlertCircle size={16} className="text-error-text mt-[2px] shrink-0" />
          <p className="text-[13px] text-error-text">{error}</p>
        </div>
      )}

      <div className="mt-section space-y-standard">
        <div>
          <label htmlFor="password" className="text-label text-dark-text block mb-micro">
            New password
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPass ? "text" : "password"}
              required
              autoComplete="new-password"
              placeholder="Minimum 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full h-[44px] px-standard pr-[48px] border border-border rounded-input text-body text-dark-text placeholder:text-grey-text/50 focus:border-border-dark focus:outline-none transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowPass(!showPass)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-grey-text hover:text-dark-text text-micro"
              aria-label={showPass ? "Hide password" : "Show password"}
            >
              {showPass ? "Hide" : "Show"}
            </button>
          </div>
        </div>

        <div>
          <label htmlFor="confirm" className="text-label text-dark-text block mb-micro">
            Confirm password
          </label>
          <input
            id="confirm"
            type={showPass ? "text" : "password"}
            required
            autoComplete="new-password"
            placeholder="Re-enter your password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="w-full h-[44px] px-standard border border-border rounded-input text-body text-dark-text placeholder:text-grey-text/50 focus:border-border-dark focus:outline-none transition-colors"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading || !password || !confirm}
        className="w-full h-[52px] mt-section bg-navy text-white font-medium rounded-btn hover:bg-mid-blue transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center"
      >
        {loading ? (
          <AnchorLoader size="sm" color="white" />
        ) : (
          "Update password →"
        )}
      </button>

      <p className="text-label text-grey-text text-center mt-page">
        <Link href="/forgot-password" className="text-navy hover:underline">
          ← Request a new reset link
        </Link>
      </p>
    </form>
  );
}
