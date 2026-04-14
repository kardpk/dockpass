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
      {/* Kicker */}
      <div className="flex items-center gap-[10px] mb-3">
        <span className="w-[24px] h-[1px] bg-[#B8882A]" />
        <span className="text-[11px] font-semibold tracking-[0.2em] uppercase text-[#B8882A]">
          Operator sign in
        </span>
      </div>

      {/* Heading */}
      <h1
        className="text-[clamp(28px,4vw,38px)] font-bold leading-[1.08] tracking-[-0.025em] text-white mb-2"
        style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
      >
        Welcome back.
      </h1>
      <p
        className="text-[15px] font-normal text-[#9AADC4] mb-8 leading-relaxed"
        style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontStyle: "italic" }}
      >
        Sign in to manage your fleet, trips & compliance
      </p>

      <div className="flex flex-col gap-5">
        {/* Email */}
        <div>
          <label
            htmlFor="email"
            className="text-[12px] font-semibold tracking-[0.06em] uppercase text-[#5A7090] block mb-2"
          >
            Email address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="hello@yourboat.com"
            className="
              w-full h-[48px] px-4 rounded-[4px]
              bg-white/[0.04] border border-white/[0.12]
              text-[15px] font-normal text-white
              placeholder:text-white/20
              focus:border-[#B8882A] focus:outline-none
              transition-colors
            "
          />
        </div>

        {/* Password */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label
              htmlFor="password"
              className="text-[12px] font-semibold tracking-[0.06em] uppercase text-[#5A7090]"
            >
              Password
            </label>
            <Link
              href="/forgot-password"
              className="text-[12px] font-normal text-[#B8882A] hover:text-[#D4A84B] transition-colors no-underline tracking-[0.02em]"
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
              className="
                w-full h-[48px] px-4 pr-12 rounded-[4px]
                bg-white/[0.04] border border-white/[0.12]
                text-[15px] font-normal text-white
                placeholder:text-white/20
                focus:border-[#B8882A] focus:outline-none
                transition-colors
              "
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5A7090] hover:text-[#9AADC4] transition-colors"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mt-4 p-3 bg-[rgba(214,59,59,0.1)] border border-[rgba(214,59,59,0.3)] rounded-[4px]">
          <p className="text-[13px] text-[#FF6B6B]">{error}</p>
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={loading}
        className="
          w-full h-[52px] mt-8
          bg-[#B8882A] text-[#07101C]
          font-semibold text-[14px] tracking-[0.04em]
          rounded-[3px] border-none cursor-pointer
          hover:bg-[#D4A84B] transition-all duration-200
          disabled:opacity-50 disabled:cursor-not-allowed
          flex items-center justify-center
          hover:translate-y-[-1px]
        "
      >
        {loading ? (
          <AnchorLoader size="sm" color="white" />
        ) : (
          "Sign in →"
        )}
      </button>

      {/* Divider */}
      <div className="flex items-center gap-4 my-6">
        <div className="flex-1 h-[1px] bg-white/[0.07]" />
        <span className="text-[11px] font-normal text-[#5A7090] tracking-[0.1em]">
          OR
        </span>
        <div className="flex-1 h-[1px] bg-white/[0.07]" />
      </div>

      {/* Footer link */}
      <p className="text-[14px] text-[#9AADC4] text-center">
        New to BoatCheckin?{" "}
        <Link
          href="/signup"
          className="text-[#B8882A] hover:text-[#D4A84B] transition-colors no-underline font-medium"
        >
          Start free trial →
        </Link>
      </p>

      {/* Trust badges */}
      <div className="flex items-center justify-center gap-2 mt-6 flex-wrap">
        {["No credit card", "14-day trial", "Cancel anytime"].map((t) => (
          <span
            key={t}
            className="text-[10px] font-normal tracking-[0.06em] text-[#5A7090]"
          >
            {t}{" "}
          </span>
        ))}
      </div>
    </form>
  );
}
