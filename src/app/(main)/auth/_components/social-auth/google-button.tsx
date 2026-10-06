"use client";

import { cn } from "cn";
import { siGoogle } from "simple-icons";

import { SimpleIcon } from "@/components/simple-icon";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

export function GoogleButton({ className, ...props }: React.ComponentProps<typeof Button>) {
  async function handleGoogleSignIn() {
    await authClient.signIn.social({ provider: "google", callbackURL: "/dashboard/finance-analyst" });
  }

  return (
    <Button variant="secondary" className={cn(className)} onClick={handleGoogleSignIn} {...props}>
      <SimpleIcon icon={siGoogle} className="size-4" />
      Continue with Google
    </Button>
  );
}
