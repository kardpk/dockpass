"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { z } from "zod";
import Link from "next/link";
import { AnchorLoader } from "@/components/ui/AnchorLoader";
import { loginAction } from "./actions";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    const formData = new FormData(e.currentTarget);
    const raw = {
      email: formData.get("email") as string,
      password: formData.get("password") as string,
    };

    const result = loginSchema.safeParse(raw);
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? "Invalid input");
      return;
    }

    setLoading(true);
    try {
      const res = await loginAction(formData);
      if (res?.error) {
        setError(res.error);
      } else {
        // Read next param — validate to prevent open redirect
        const nextPath = searchParams.get('next');
        const safePath =
          nextPath && nextPath.startsWith('/dashboard')
            ? nextPath
            : '/dashboard';
        router.push(safePath);
        router.refresh();
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <h1 className="text-h1 text-dark-text">Welcome back</h1>
      <p className="text-body text-grey-text mt-tight">
        Sign in to your BoatCheckin account
      </p>

      <div className="mt-section flex flex-col gap-page">
        {/* Email */}
        <div>
          <label htmlFor="email" className="text-label text-dark-text block mb-micro">
            Email address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="hello@yourboat.com"
            className="w-full h-[44px] px-standard border border-border rounded-input text-body text-dark-text placeholder:text-grey-text/50 focus:border-border-dark focus:outline-none transition-colors"
          />
        </div>

        {/* Password */}
        <div>
          <div className="flex items-center justify-between mb-micro">
            <label htmlFor="password" className="text-label text-dark-text">
              Password
            </label>
            <Link
              href="/forgot-password"
              className="text-micro text-navy hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              required
              placeholder="Enter your password"
              className="w-full h-[44px] px-standard pr-[44px] border border-border rounded-input text-body text-dark-text placeholder:text-grey-text/50 focus:border-border-dark focus:outline-none transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-grey-text hover:text-dark-text transition-colors"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mt-page p-standard bg-error-bg rounded-chip">
          <p className="text-[13px] text-error-text">{error}</p>
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={loading}
        className="w-full h-[52px] mt-section bg-navy text-white font-medium rounded-btn hover:bg-mid-blue transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center"
      >
        {loading ? (
          <AnchorLoader size="sm" color="white" />
        ) : (
          "Sign in →"
        )}
      </button>

      {/* Footer link */}
      <p className="text-label text-grey-text text-center mt-page">
        New to BoatCheckin?{" "}
        <Link href="/signup" className="text-navy hover:underline">
          Start free trial →
        </Link>
      </p>
    </form>
  );
}
