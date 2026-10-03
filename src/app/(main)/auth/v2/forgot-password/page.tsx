import Link from "next/link";

import { Globe } from "lucide-react";
import type { Metadata } from "next";

import { APP_CONFIG } from "@/config/app-config";

import { ForgotPasswordForm } from "../../_components/forgot-password-form";

export const metadata: Metadata = {
  title: "Open Source Branded Forgot Password Page with shadcn/ui",
  description:
    "Explore an open source branded forgot password page with a two-column layout and an email field to request a password reset link.",
  alternates: {
    canonical: "/auth/v2/forgot-password",
  },
};

export default function ForgotPasswordV2() {
  return (
    <>
      <div className="mx-auto flex w-full flex-col justify-center space-y-8 sm:w-[350px]">
        <div className="space-y-2 text-center">
          <h1 className="font-medium text-3xl">Reset your password</h1>
          <p className="text-muted-foreground text-sm">Enter your email and we&apos;ll send you a reset link.</p>
        </div>
        <div className="space-y-4">
          <ForgotPasswordForm />
        </div>
      </div>

      <div className="absolute top-5 flex w-full justify-end px-10">
        <div className="text-muted-foreground text-sm">
          Remember your password?{" "}
          <Link prefetch={false} className="text-foreground" href="login">
            Login
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
