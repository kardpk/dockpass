"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { z } from "zod";
import Link from "next/link";
import { AnchorLoader } from "@/components/ui/AnchorLoader";
import { signupAction } from "./actions";

const signupSchema = z.object({
  fullName: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100),
  companyName: z.string().max(100).optional(),
  email: z.string().email("Please enter a valid email"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(100),
});

type FieldErrors = Partial<Record<keyof z.infer<typeof signupSchema>, string>>;

export function SignupForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState("");

  function validateField(name: string, value: string) {
    const partial = { [name]: value };
    const result = signupSchema.partial().safeParse(partial);
    if (!result.success) {
      const fieldError = result.error.issues.find(
        (i) => i.path[0] === name
      );
      if (fieldError) {
        setErrors((prev) => ({ ...prev, [name]: fieldError.message }));
      }
    } else {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name as keyof FieldErrors];
        return next;
      });
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setServerError("");

    const formData = new FormData(e.currentTarget);
    const raw = {
      fullName: formData.get("fullName") as string,
      companyName: (formData.get("companyName") as string) || undefined,
      email: formData.get("email") as string,
      password: formData.get("password") as string,
    };

    // Client validation
    const result = signupSchema.safeParse(raw);
    if (!result.success) {
      const fieldErrors: FieldErrors = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0] as keyof FieldErrors;
        if (!fieldErrors[key]) fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);
    try {
      const res = await signupAction(formData);
      if (res?.error) {
        if (res.field) {
          setErrors({ [res.field]: res.error });
        } else {
          setServerError(res.error);
        }
      } else {
        router.push("/dashboard/boats/new");
      }
    } catch {
      setServerError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const inputClasses = `
    w-full h-[48px] px-4 rounded-[4px]
    bg-white/[0.04] border border-white/[0.12]
    text-[15px] font-normal text-white
    placeholder:text-white/20
    focus:border-[#B8882A] focus:outline-none
    transition-colors
  `;

  return (
    <form onSubmit={handleSubmit} noValidate>
      {/* Kicker */}
      <div className="flex items-center gap-[10px] mb-3">
        <span className="w-[24px] h-[1px] bg-[#B8882A]" />
        <span className="text-[11px] font-semibold tracking-[0.2em] uppercase text-[#B8882A]">
          14-day free trial
        </span>
      </div>

      {/* Heading */}
      <h1
        className="text-[clamp(28px,4vw,38px)] font-bold leading-[1.08] tracking-[-0.025em] text-white mb-2"
        style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
      >
        Start your <em className="italic text-[#B8882A]">free trial.</em>
      </h1>
      <p
        className="text-[15px] font-normal text-[#9AADC4] mb-8 leading-relaxed"
        style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontStyle: "italic" }}
      >
        Set up your first vessel in 15 minutes. No credit card.
      </p>

      <div className="flex flex-col gap-5">
        {/* Full name */}
        <div>
          <label
            htmlFor="fullName"
            className="text-[12px] font-semibold tracking-[0.06em] uppercase text-[#5A7090] block mb-2"
          >
            Full name
          </label>
          <input
            id="fullName"
            name="fullName"
            type="text"
            required
            placeholder="Captain Conrad Rivera"
            onBlur={(e) => validateField("fullName", e.target.value)}
            className={inputClasses}
          />
          {errors.fullName && (
            <p className="text-[12px] text-[#FF6B6B] mt-1.5">{errors.fullName}</p>
          )}
        </div>

        {/* Company name */}
        <div>
          <label
            htmlFor="companyName"
            className="text-[12px] font-semibold tracking-[0.06em] uppercase text-[#5A7090] block mb-2"
          >
            Company or boat name
            <span className="font-normal normal-case tracking-normal ml-2 text-[#5A7090]/60">
              optional
            </span>
          </label>
          <input
            id="companyName"
            name="companyName"
            type="text"
            placeholder="Conrad Charter Co."
            className={inputClasses}
          />
        </div>

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
            onBlur={(e) => validateField("email", e.target.value)}
            className={inputClasses}
          />
          {errors.email && (
            <p className="text-[12px] text-[#FF6B6B] mt-1.5">{errors.email}</p>
          )}
        </div>

        {/* Password */}
        <div>
          <label
            htmlFor="password"
            className="text-[12px] font-semibold tracking-[0.06em] uppercase text-[#5A7090] block mb-2"
          >
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              required
              placeholder="Min 8 characters"
              onBlur={(e) => validateField("password", e.target.value)}
              className={`${inputClasses} pr-12`}
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
          {errors.password && (
            <p className="text-[12px] text-[#FF6B6B] mt-1.5">{errors.password}</p>
          )}
        </div>
      </div>

      {/* Server error */}
      {serverError && (
        <div className="mt-4 p-3 bg-[rgba(214,59,59,0.1)] border border-[rgba(214,59,59,0.3)] rounded-[4px]">
          <p className="text-[13px] text-[#FF6B6B]">{serverError}</p>
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
          "Create account →"
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
        Already have an account?{" "}
        <Link
          href="/login"
          className="text-[#B8882A] hover:text-[#D4A84B] transition-colors no-underline font-medium"
        >
          Sign in →
        </Link>
      </p>

      {/* Compliance badges */}
      <div className="flex items-center justify-center gap-2 mt-6 flex-wrap">
        {["ESIGN Act", "USCG Compliant", "GDPR Ready"].map((badge) => (
          <span
            key={badge}
            className="text-[10px] font-medium tracking-[0.08em] uppercase text-[#B8882A] border border-[rgba(184,136,42,0.28)] bg-[rgba(184,136,42,0.1)] px-[10px] py-[4px] rounded-[3px]"
          >
            {badge}
          </span>
        ))}
      </div>
    </form>
  );
}
