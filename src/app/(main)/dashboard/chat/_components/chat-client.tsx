"use client";

import { useEffect, useRef, useState, useTransition } from "react";

import { useRouter } from "next/navigation";

import { cn } from "cn";
import { MessageSquare, Plus, Send, User, Users } from "lucide-react";
import { toast } from "sonner";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Bubble, BubbleContent } from "@/components/ui/bubble";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { AppUser, ChatMessage, Conversation } from "@/server/feature-actions";
import { createConversation, getConversationMessages, sendChatMessage } from "@/server/feature-actions";

interface ChatClientProps {
  conversations: Conversation[];
  currentUserId: string;
  allUsers: Pick<AppUser, "id" | "name" | "email" | "image">[];
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function formatRelativeTime(isoString: string): string {
  const ms = Date.now() - new Date(isoString).getTime();
  const minutes = Math.floor(ms / 60000);
  if (minutes < 1) return "now";
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

export function ChatClient({ conversations: initialConversations, currentUserId, allUsers }: ChatClientProps) {
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>(initialConversations);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isNewConvOpen, setIsNewConvOpen] = useState(false);
  const [newConvName, setNewConvName] = useState("");
  const [newConvIsGroup, setNewConvIsGroup] = useState(false);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [isSending, startSending] = useTransition();
  const [isLoadingMessages, startLoadingMessages] = useTransition();
  const [isCreating, startCreating] = useTransition();
  const bottomRef = useRef<HTMLDivElement>(null);

  const filteredUsers = allUsers.filter(
    (u) =>
      u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase()),
  );

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  function handleSelectConversation(id: string) {
    if (id === selectedId) return;
    setSelectedId(id);
    setMessages([]);
    startLoadingMessages(async () => {
      const msgs = await getConversationMessages(id);
      setMessages(msgs);
    });
  }

  function handleSend() {
    if (!input.trim() || !selectedId || isSending) return;
    const content = input.trim();
    setInput("");
    startSending(async () => {
      try {
        const msg = await sendChatMessage(selectedId, content);
        setMessages((prev) => [...prev, msg]);
        setConversations((prev) =>
          prev
            .map((c) => (c.id === selectedId ? { ...c, lastMessage: content, lastMessageAt: msg.createdAt } : c))
            .sort((a, b) => new Date(b.lastMessageAt ?? 0).getTime() - new Date(a.lastMessageAt ?? 0).getTime()),
        );
        router.refresh();
      } catch {
        toast.error("Failed to send message");
      }
    });
  }

  function handleCreateConversation() {
    if (!newConvName.trim() || isCreating) return;
    const name = newConvName.trim();
    startCreating(async () => {
      try {
        const conv = await createConversation(name, newConvIsGroup, selectedUserIds);
        setConversations((prev) => [conv, ...prev]);
        setIsNewConvOpen(false);
        setNewConvName("");
        setNewConvIsGroup(false);
        setSelectedUserIds([]);
        setUserSearch("");
        handleSelectConversation(conv.id);
        toast.success("Conversation created");
        router.refresh();
      } catch {
        toast.error("Failed to create conversation");
      }
    });
  }

  function toggleUser(id: string) {
    setSelectedUserIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  const selectedConversation = conversations.find((c) => c.id === selectedId) ?? null;

  return (
    <div className="flex h-full w-full">
      {/* ── Sidebar ── */}
      <div className="flex w-64 shrink-0 flex-col border-r sm:w-72">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h2 className="font-semibold text-sm">Messages</h2>
          <Button size="icon-sm" variant="ghost" onClick={() => setIsNewConvOpen(true)} aria-label="New conversation">
            <Plus />
          </Button>
        </div>
        <ScrollArea className="flex-1">
          <div className="flex flex-col py-1">
            {conversations.map((conv) => (
              <button
                key={conv.id}
                type="button"
                onClick={() => handleSelectConversation(conv.id)}
                className={cn(
                  "flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-accent",
                  selectedId === conv.id && "bg-accent",
                )}
              >
                <Avatar size="default">
                  <AvatarFallback>{getInitials(conv.name ?? "?")}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1">
                    {conv.isGroup && <Users className="size-3 shrink-0 text-muted-foreground" />}
                    <span className="truncate font-medium text-sm">{conv.name}</span>
                  </div>
                  {conv.lastMessage && <p className="truncate text-muted-foreground text-xs">{conv.lastMessage}</p>}
                </div>
                {conv.lastMessageAt && (
                  <span className="shrink-0 text-muted-foreground text-xs">
                    {formatRelativeTime(conv.lastMessageAt)}
                  </span>
                )}
              </button>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* ── Main area ── */}
      <div className="flex min-w-0 flex-1 flex-col">
        {selectedConversation ? (
          <>
            {/* Header */}
            <div className="flex items-center gap-3 border-b px-4 py-3">
              <Avatar size="default">
                <AvatarFallback>{getInitials(selectedConversation.name ?? "?")}</AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center gap-1.5">
                  {selectedConversation.isGroup ? (
                    <Users className="size-3.5 text-muted-foreground" />
                  ) : (
                    <User className="size-3.5 text-muted-foreground" />
                  )}
                  <span className="font-semibold text-sm">{selectedConversation.name}</span>
                </div>
                <p className="text-muted-foreground text-xs">
                  {selectedConversation.participants.length} participant
                  {selectedConversation.participants.length !== 1 ? "s" : ""}
                </p>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 px-4 py-4">
              {isLoadingMessages && (
                <div className="flex items-center justify-center py-10">
                  <p className="text-muted-foreground text-sm">Loading messages…</p>
                </div>
              )}
              {!isLoadingMessages && messages.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <MessageSquare className="mb-2 size-8 text-muted-foreground" />
                  <p className="font-medium text-sm">No messages yet</p>
                  <p className="text-muted-foreground text-xs">Start the conversation below</p>
                </div>
              )}
              {!isLoadingMessages && messages.length > 0 && (
                <div className="flex flex-col gap-3">
                  {messages.map((msg) => {
                    const isOwn = msg.senderId === currentUserId;
                    return (
                      <div key={msg.id} className={cn("flex flex-col gap-0.5", isOwn && "items-end")}>
                        <span className="px-1 text-muted-foreground text-xs">{msg.senderName}</span>
                        <Bubble variant={isOwn ? "default" : "muted"} align={isOwn ? "end" : "start"}>
                          <BubbleContent>{msg.content}</BubbleContent>
                        </Bubble>
                      </div>
                    );
                  })}
                  <div ref={bottomRef} />
                </div>
              )}
            </ScrollArea>

            {/* Input */}
            <div className="border-t px-4 py-3">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
                className="flex gap-2"
              >
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type a message…"
                  className="h-9 flex-1"
                  disabled={isSending}
                />
                <Button
                  type="submit"
                  size="icon-sm"
                  disabled={!input.trim() || isSending}
                  aria-label="Send message"
                  className="size-9 shrink-0"
                >
                  <Send />
                </Button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
            <div className="grid size-12 place-items-center rounded-full bg-muted">
              <MessageSquare className="size-6 text-muted-foreground" />
            </div>
            <div>
              <p className="font-medium text-sm">Select a conversation</p>
              <p className="text-muted-foreground text-xs">Choose from the list or start a new one</p>
            </div>
            <Button size="sm" variant="outline" onClick={() => setIsNewConvOpen(true)}>
              <Plus />
              New conversation
            </Button>
          </div>
        )}
      </div>

      {/* ── New conversation dialog ── */}
      <Dialog
        open={isNewConvOpen}
        onOpenChange={(open) => {
          setIsNewConvOpen(open);
          if (!open) {
            setNewConvName("");
            setNewConvIsGroup(false);
            setSelectedUserIds([]);
            setUserSearch("");
          }
        }}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>New Conversation</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-1">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="conv-name">Name</Label>
              <Input
                id="conv-name"
                value={newConvName}
                onChange={(e) => setNewConvName(e.target.value)}
                placeholder="e.g. Sarah or Design Team"
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreateConversation();
                }}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Add participants</Label>
              <Input value={userSearch} onChange={(e) => setUserSearch(e.target.value)} placeholder="Search users…" />
              {selectedUserIds.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {selectedUserIds.map((uid) => {
                    const u = allUsers.find((x) => x.id === uid);
                    return u ? (
                      <span key={uid} className="flex items-center gap-1 rounded-full bg-accent px-2 py-0.5 text-xs">
                        {u.name}
                        <button
                          type="button"
                          onClick={() => toggleUser(uid)}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          ×
                        </button>
                      </span>
                    ) : null;
                  })}
                </div>
              )}
              <ScrollArea className="h-36 rounded-md border">
                <div className="flex flex-col py-1">
                  {filteredUsers.length === 0 ? (
                    <p className="px-3 py-4 text-center text-muted-foreground text-xs">No users found</p>
                  ) : (
                    filteredUsers.map((u) => (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => toggleUser(u.id)}
                        className={cn(
                          "flex items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-accent",
                          selectedUserIds.includes(u.id) && "bg-accent",
                        )}
                      >
                        <Avatar size="sm">
                          <AvatarFallback className="text-xs">{getInitials(u.name)}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="truncate font-medium text-sm">{u.name}</p>
                          <p className="truncate text-muted-foreground text-xs">{u.email}</p>
                        </div>
                        {selectedUserIds.includes(u.id) && <span className="ml-auto text-primary text-xs">✓</span>}
                      </button>
                    ))
                  )}
                </div>
              </ScrollArea>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="is-group"
                checked={newConvIsGroup}
                onCheckedChange={(checked) => setNewConvIsGroup(checked === true)}
              />
              <Label htmlFor="is-group" className="cursor-pointer font-normal">
                Group conversation
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNewConvOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateConversation} disabled={!newConvName.trim() || isCreating}>
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
