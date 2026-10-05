import { Suspense } from "react";

import Link from "next/link";

import { Globe } from "lucide-react";
import type { Metadata } from "next";

import { APP_CONFIG } from "@/config/app-config";

import { OtpForm } from "../../_components/otp-form";

export const metadata: Metadata = {
  title: "Open Source Branded OTP Verification Page with shadcn/ui",
  description:
    "Explore an open source branded OTP verification page with a two-column layout and a 6-digit code input.",
  alternates: {
    canonical: "/auth/v2/otp",
  },
};

export default function OtpV2() {
  return (
    <>
      <div className="mx-auto flex w-full flex-col justify-center space-y-8 sm:w-[350px]">
        <div className="space-y-2 text-center">
          <h1 className="font-medium text-3xl">Check your inbox</h1>
          <p className="text-muted-foreground text-sm">Enter the 6-digit code we sent to your email address.</p>
        </div>
        <div className="flex flex-col items-center gap-4">
          <Suspense>
            <OtpForm />
          </Suspense>
          <p className="text-muted-foreground text-sm">
            Didn&apos;t receive the code?{" "}
            <button type="button" className="text-foreground underline-offset-4 hover:underline">
              Resend
            </button>
          </p>
        </div>
      </div>

      <div className="absolute top-5 flex w-full justify-end px-10">
        <div className="text-muted-foreground text-sm">
          <Link prefetch={false} className="text-foreground" href="login">
            Back to login
          </Link>
        </div>
      </div>

      <div className="absolute bottom-5 flex w-full justify-between px-10">
        <div className="text-sm">{APP_CONFIG.copyright}</div>
        <div className="flex items-center gap-1 text-sm">
          <Globe className="size-4 text-muted-foreground" />
          ENG
        </div>
      </div>
    </>
  );
}
