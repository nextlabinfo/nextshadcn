"use client";

import { useRouter, useSearchParams } from "next/navigation";

import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup } from "@/components/ui/field";
import { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot } from "@/components/ui/input-otp";
import { authClient } from "@/lib/auth-client";

const formSchema = z.object({
  otp: z.string().length(6, { message: "Please enter all 6 digits." }),
});

export function OtpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";
  const type = searchParams.get("type") ?? "forget-password";

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { otp: "" },
  });

  async function onSubmit(data: z.infer<typeof formSchema>) {
    if (type === "forget-password") {
      const { error } = await authClient.signIn.emailOtp({
        email,
        otp: data.otp,
      });

      if (error) {
        toast.error(error.message ?? "Invalid or expired code.");
        return;
      }

      toast.success("Verified. Welcome back!");
      router.push("/dashboard");
      router.refresh();
    } else {
      const { error } = await authClient.emailOtp.verifyEmail({
        email,
        otp: data.otp,
      });

      if (error) {
        toast.error(error.message ?? "Invalid or expired code.");
        return;
      }

      toast.success("Email verified.");
      router.push("/dashboard");
      router.refresh();
    }
  }

  return (
    <form noValidate onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <FieldGroup className="gap-4">
        <Controller
          control={form.control}
          name="otp"
          render={({ field, fieldState }) => (
            <Field className="items-center gap-1.5" data-invalid={fieldState.invalid}>
              <InputOTP maxLength={6} value={field.value} onChange={field.onChange} aria-invalid={fieldState.invalid}>
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                </InputOTPGroup>
                <InputOTPSeparator />
                <InputOTPGroup>
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      </FieldGroup>
      <Button className="w-full" type="submit" disabled={form.formState.isSubmitting}>
        {form.formState.isSubmitting ? "Verifying…" : "Verify Code"}
      </Button>
    </form>
  );
}
