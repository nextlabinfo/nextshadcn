"use client";

import { FormProvider, useForm, useWatch } from "react-hook-form";

import type { InvoiceFormValues, InvoiceToDetails } from "./data";
import { InvoiceForm } from "./invoice-form";
import { InvoicePreview } from "./invoice-preview";

export function Invoice({
  initialValues,
  clients,
}: {
  initialValues: InvoiceFormValues;
  clients: InvoiceToDetails[];
}) {
  const form = useForm<InvoiceFormValues>({
    defaultValues: initialValues,
  });
  const invoice = useWatch({ control: form.control }) as InvoiceFormValues;

  return (
    <FormProvider {...form}>
      <form className="grid gap-5 xl:grid-cols-2" noValidate onSubmit={(event) => event.preventDefault()}>
        <InvoiceForm clients={clients} />
        <InvoicePreview invoice={invoice} />
      </form>
    </FormProvider>
  );
}
