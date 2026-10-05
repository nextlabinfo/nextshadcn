import type { Metadata } from "next";

import { getMailLabels, getMailMessages } from "@/server/feature-actions";

import { MailClient } from "./_components/mail-client";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: true,
  },
};

export default async function Page() {
  const [messages, labels] = await Promise.all([getMailMessages("inbox"), getMailLabels()]);
  return (
    <div className="flex h-full" data-content-padding="false">
      <MailClient initialMessages={messages} labels={labels} />
    </div>
  );
}
