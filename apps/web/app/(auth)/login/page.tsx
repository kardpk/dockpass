import type { Metadata } from "next";
import { LoginForm } from "./LoginForm";
import { AUTH_ERRORS } from "./error-messages";

export const metadata: Metadata = {
  title: "Sign in — BoatCheckin",
};

export default async function LoginPage(props: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const searchParams = await props.searchParams;
  const errorCode =
    typeof searchParams.error === "string" ? searchParams.error : undefined;
  const errorMessage = errorCode ? AUTH_ERRORS[errorCode] : undefined;

  return (
    <>
      {errorMessage && (
        <div className="mb-5 p-3 bg-[rgba(214,59,59,0.1)] border border-[rgba(214,59,59,0.3)] rounded-[4px]">
          <p className="text-[13px] text-[#FF6B6B]">{errorMessage}</p>
        </div>
      )}
      <LoginForm />
    </>
  );
}
