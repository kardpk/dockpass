import type { Metadata } from "next";
import { SignupForm } from "./SignupForm";

export const metadata: Metadata = {
  title: "Start free trial — BoatCheckin",
  description: "14-day free trial. No credit card required.",
};

export default function SignupPage() {
  return <SignupForm />;
}
