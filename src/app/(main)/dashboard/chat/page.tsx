import { headers } from "next/headers";

import type { Metadata } from "next";

import { auth } from "@/lib/auth";
import { getActiveUsers, getChatConversations } from "@/server/feature-actions";

import { ChatClient } from "./_components/chat-client";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: true,
  },
};

export default async function Page() {
  const [conversations, allUsers, session] = await Promise.all([
    getChatConversations(),
    getActiveUsers(),
    auth.api.getSession({ headers: await headers() }),
  ]);

  const currentUserId = session?.user?.id ?? "";

  return (
    <div className="flex h-full" data-content-padding="false">
      <ChatClient conversations={conversations} currentUserId={currentUserId} allUsers={allUsers} />
    </div>
  );
}
