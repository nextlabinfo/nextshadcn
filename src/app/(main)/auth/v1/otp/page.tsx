import Link from "next/link";

import { Command } from "lucide-react";
import type { Metadata } from "next";

import { OtpForm } from "../../_components/otp-form";

export const metadata: Metadata = {
  title: "Open Source Split Screen OTP Verification Page with shadcn/ui",
  description:
    "Explore an open source split screen OTP verification page with a 6-digit code input for two-factor authentication.",
  alternates: {
    canonical: "/auth/v1/otp",
  },
};

export default function OtpV1() {
  return (
    <div className="flex h-dvh">
      <div className="hidden bg-primary lg:block lg:w-1/3">
        <div className="flex h-full flex-col items-center justify-center p-12 text-center">
          <div className="space-y-6">
            <Command className="mx-auto size-12 text-primary-foreground" />
            <div className="space-y-2">
              <h1 className="font-light text-5xl text-primary-foreground">Check your inbox</h1>
              <p className="text-primary-foreground/80 text-xl">Enter the code we sent you.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex w-full items-center justify-center bg-background p-8 lg:w-2/3">
        <div className="w-full max-w-md space-y-10 py-24 lg:py-32">
          <div className="space-y-4 text-center">
            <div className="font-medium tracking-tight">Two-Factor Verification</div>
            <div className="mx-auto max-w-xl text-muted-foreground">
              We sent a 6-digit code to your email. Enter it below to continue.
            </div>
          </div>
          <div className="flex flex-col items-center gap-4">
            <OtpForm />
            <p className="text-center text-muted-foreground text-xs">
              Didn&apos;t receive the code?{" "}
              <button type="button" className="text-primary">
                Resend
              </button>
            </p>
            <p className="text-center text-muted-foreground text-xs">
              <Link prefetch={false} href="login" className="text-primary">
                Back to login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
