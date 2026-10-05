"use client";

import { useState, useTransition } from "react";

import { useRouter } from "next/navigation";

import { cn } from "cn";
import {
  AlertCircle,
  ArrowLeft,
  FileText,
  Flag,
  Inbox,
  Mail,
  MailOpen,
  Pencil,
  Send,
  Star,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import type { MailLabel, MailMessage } from "@/server/feature-actions";
import {
  deleteMailMessage,
  getMailMessage,
  getMailMessages,
  sendMail,
  updateMailStatus,
} from "@/server/feature-actions";

// ─── Types & constants ─────────────────────────────────────────────────────────

type Filter = "all" | "unread" | "starred" | "important";

const FOLDERS = [
  { id: "inbox", label: "Inbox", icon: Inbox },
  { id: "sent", label: "Sent", icon: Send },
  { id: "drafts", label: "Drafts", icon: FileText },
  { id: "trash", label: "Trash", icon: Trash2 },
  { id: "spam", label: "Spam", icon: AlertCircle },
] as const;

const LABEL_COLORS: Record<string, string> = {
  work: "bg-blue-500",
  urgent: "bg-red-500",
  review: "bg-amber-500",
};

interface MailClientProps {
  initialMessages: MailMessage[];
  labels: MailLabel[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function formatMailDate(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = diffMs / 3600000;

  if (diffHours < 24 && date.getDate() === now.getDate()) {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  if (diffHours < 168) {
    return date.toLocaleDateString([], { weekday: "short" });
  }
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

function formatMailDateLong(isoString: string): string {
  return new Date(isoString).toLocaleString([], {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ─── Component ────────────────────────────────────────────────────────────────

export function MailClient({ initialMessages, labels }: MailClientProps) {
  const router = useRouter();

  // Folder + filter state
  const [selectedFolder, setSelectedFolder] = useState("inbox");
  const [filter, setFilter] = useState<Filter>("all");
  const [messages, setMessages] = useState<MailMessage[]>(initialMessages);
  const [selectedMessage, setSelectedMessage] = useState<MailMessage | null>(null);

  // Compose state
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [composeTo, setComposeTo] = useState("");
  const [composeSubject, setComposeSubject] = useState("");
  const [composeBody, setComposeBody] = useState("");

  const [isPending, startTransition] = useTransition();

  // ── Folder selection ──────────────────────────────────────────────────────

  function handleSelectFolder(folder: string) {
    if (folder === selectedFolder) return;
    setSelectedFolder(folder);
    setSelectedMessage(null);
    setFilter("all");
    startTransition(async () => {
      try {
        const msgs = await getMailMessages(folder);
        setMessages(msgs);
      } catch {
        toast.error("Failed to load messages");
      }
    });
  }

  // ── Mail selection ────────────────────────────────────────────────────────

  function handleSelectMail(id: string) {
    startTransition(async () => {
      try {
        const mail = await getMailMessage(id);
        if (!mail) return;
        setSelectedMessage(mail);
        if (!mail.isRead) {
          await updateMailStatus(id, { isRead: true });
          setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, isRead: true } : m)));
        }
      } catch {
        toast.error("Failed to load message");
      }
    });
  }

  // ── Actions ───────────────────────────────────────────────────────────────

  function handleToggleStar(id: string, current: boolean) {
    startTransition(async () => {
      try {
        await updateMailStatus(id, { isStarred: !current });
        setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, isStarred: !current } : m)));
        setSelectedMessage((prev) => (prev?.id === id ? { ...prev, isStarred: !current } : prev));
        router.refresh();
      } catch {
        toast.error("Failed to update message");
      }
    });
  }

  function handleToggleImportant(id: string, current: boolean) {
    startTransition(async () => {
      try {
        await updateMailStatus(id, { isImportant: !current });
        setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, isImportant: !current } : m)));
        setSelectedMessage((prev) => (prev?.id === id ? { ...prev, isImportant: !current } : prev));
        router.refresh();
      } catch {
        toast.error("Failed to update message");
      }
    });
  }

  function handleToggleRead(id: string, current: boolean) {
    startTransition(async () => {
      try {
        await updateMailStatus(id, { isRead: !current });
        setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, isRead: !current } : m)));
        setSelectedMessage((prev) => (prev?.id === id ? { ...prev, isRead: !current } : prev));
        router.refresh();
      } catch {
        toast.error("Failed to update message");
      }
    });
  }

  function handleDelete(id: string) {
    const msg = messages.find((m) => m.id === id);
    startTransition(async () => {
      try {
        await deleteMailMessage(id);
        if (msg?.folder === "trash") {
          setMessages((prev) => prev.filter((m) => m.id !== id));
          toast.success("Message permanently deleted");
        } else {
          setMessages((prev) => prev.filter((m) => m.id !== id));
          toast.success("Moved to trash");
        }
        if (selectedMessage?.id === id) setSelectedMessage(null);
        router.refresh();
      } catch {
        toast.error("Failed to delete message");
      }
    });
  }

  function handleSendMail() {
    if (!composeTo.trim() || !composeSubject.trim() || isPending) return;
    startTransition(async () => {
      try {
        await sendMail({ to: composeTo.trim(), subject: composeSubject.trim(), body: composeBody });
        setIsComposeOpen(false);
        setComposeTo("");
        setComposeSubject("");
        setComposeBody("");
        toast.success("Message sent");
        router.refresh();
      } catch {
        toast.error("Failed to send message");
      }
    });
  }

  // ── Derived data ──────────────────────────────────────────────────────────

  const inboxUnreadCount = messages.filter((m) => m.folder === "inbox" && !m.isRead).length;

  const filteredMessages = messages.filter((m) => {
    if (filter === "unread") return !m.isRead;
    if (filter === "starred") return m.isStarred;
    if (filter === "important") return m.isImportant;
    return true;
  });

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="flex h-full w-full overflow-hidden">
      {/* ── Folder sidebar ── */}
      <div className="hidden w-44 shrink-0 flex-col border-r lg:flex">
        <div className="border-b px-3 py-3">
          <Button size="sm" className="w-full" onClick={() => setIsComposeOpen(true)}>
            <Pencil />
            Compose
          </Button>
        </div>
        <ScrollArea className="flex-1 py-2">
          <nav>
            <ul className="flex flex-col gap-0.5 px-1">
              {FOLDERS.map(({ id, label, icon: Icon }) => {
                const isActive = selectedFolder === id;
                const count = id === "inbox" && inboxUnreadCount > 0 ? inboxUnreadCount : null;
                return (
                  <li key={id}>
                    <button
                      type="button"
                      onClick={() => handleSelectFolder(id)}
                      className={cn(
                        "flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-sm transition-colors hover:bg-accent",
                        isActive && "bg-accent font-medium",
                      )}
                    >
                      <Icon className="size-4 shrink-0 text-muted-foreground" />
                      <span className="flex-1 truncate">{label}</span>
                      {count !== null && (
                        <Badge variant="default" className="h-4 min-w-4 px-1 text-xs">
                          {count}
                        </Badge>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>

            {labels.length > 0 && (
              <>
                <Separator className="my-2" />
                <p className="mb-1·px-3·font-medium·text-muted-foreground·text-xs·uppercase·tracking-wide">Labels</p>
                <ul className="flex flex-col gap-0.5 px-1">
                  {labels.map((label) => (
                    <li key={label.id}>
                      <span className="flex items-center gap-2 px-2.5 py-1.5 text-sm">
                        <span
                          className={cn("size-2.5 shrink-0 rounded-full", LABEL_COLORS[label.id] ?? "bg-muted")}
                          aria-hidden="true"
                        />
                        {label.name}
                      </span>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </nav>
        </ScrollArea>
      </div>

      {/* ── Mail list ── */}
      <div
        className={cn(
          "flex shrink-0 flex-col border-r",
          selectedMessage ? "hidden lg:flex lg:w-80" : "flex w-full lg:w-80",
        )}
      >
        {/* Compose on mobile + list header */}
        <div className="flex items-center justify-between gap-2 border-b px-3 py-2 lg:hidden">
          <span className="font-semibold text-sm capitalize">{selectedFolder}</span>
          <Button size="sm" onClick={() => setIsComposeOpen(true)}>
            <Pencil />
            Compose
          </Button>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-0 border-b">
          {(["all", "unread", "starred", "important"] as Filter[]).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={cn(
                "flex-1 border-b-2 py-2 text-center text-xs capitalize transition-colors hover:text-foreground",
                filter === f
                  ? "border-primary font-medium text-foreground"
                  : "border-transparent text-muted-foreground",
              )}
            >
              {f}
            </button>
          ))}
        </div>

        <ScrollArea className="flex-1">
          {filteredMessages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Mail className="mb-2 size-8 text-muted-foreground" />
              <p className="text-muted-foreground text-sm">No messages</p>
            </div>
          ) : (
            <ul>
              {filteredMessages.map((mail) => (
                <li key={mail.id}>
                  <button
                    type="button"
                    onClick={() => handleSelectMail(mail.id)}
                    className={cn(
                      "flex w-full flex-col gap-1 border-b px-3 py-3 text-left transition-colors hover:bg-accent",
                      selectedMessage?.id === mail.id && "bg-accent",
                      !mail.isRead && "bg-accent/40",
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <Avatar size="sm">
                        <AvatarFallback>{getInitials(mail.fromName)}</AvatarFallback>
                      </Avatar>
                      <div className="flex min-w-0 flex-1 items-center gap-1.5">
                        {!mail.isRead && (
                          <span className="size-1.5 shrink-0 rounded-full bg-primary" role="img" aria-label="Unread" />
                        )}
                        <span className={cn("truncate text-sm", !mail.isRead && "font-semibold")}>{mail.fromName}</span>
                      </div>
                      <span className="shrink-0 text-muted-foreground text-xs">{formatMailDate(mail.createdAt)}</span>
                    </div>
                    <p
                      className={cn(
                        "truncate text-sm leading-none",
                        !mail.isRead ? "font-medium" : "text-muted-foreground",
                      )}
                    >
                      {mail.subject}
                    </p>
                    <div className="flex items-center gap-1.5 pt-0.5">
                      {mail.isStarred && <Star className="size-3 fill-amber-400 text-amber-400" />}
                      {mail.isImportant && <Flag className="size-3 fill-primary text-primary" />}
                      {mail.labels.map((labelId) => {
                        const labelDef = labels.find((l) => l.id === labelId);
                        if (!labelDef) return null;
                        return (
                          <span
                            key={labelId}
                            className={cn("size-2 rounded-full", LABEL_COLORS[labelId] ?? "bg-muted")}
                            role="img"
                            title={labelDef.name}
                            aria-label={labelDef.name}
                          />
                        );
                      })}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </ScrollArea>
      </div>

      {/* ── Mail detail ── */}
      <div className={cn("min-w-0 flex-1 flex-col", selectedMessage ? "flex" : "hidden lg:flex")}>
        {selectedMessage ? (
          <>
            {/* Detail header */}
            <div className="flex items-start justify-between gap-3 border-b px-4 py-3">
              <div className="flex min-w-0 items-center gap-2">
                <Button
                  size="icon-sm"
                  variant="ghost"
                  onClick={() => setSelectedMessage(null)}
                  aria-label="Back to list"
                  className="lg:hidden"
                >
                  <ArrowLeft />
                </Button>
                <h2 className="min-w-0 truncate font-semibold text-sm">{selectedMessage.subject}</h2>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <Button
                  size="icon-sm"
                  variant="ghost"
                  onClick={() => handleToggleStar(selectedMessage.id, selectedMessage.isStarred)}
                  aria-label={selectedMessage.isStarred ? "Unstar" : "Star"}
                  disabled={isPending}
                >
                  <Star className={cn("size-4", selectedMessage.isStarred && "fill-amber-400 text-amber-400")} />
                </Button>
                <Button
                  size="icon-sm"
                  variant="ghost"
                  onClick={() => handleToggleImportant(selectedMessage.id, selectedMessage.isImportant)}
                  aria-label={selectedMessage.isImportant ? "Mark not important" : "Mark important"}
                  disabled={isPending}
                >
                  <Flag className={cn("size-4", selectedMessage.isImportant && "fill-primary text-primary")} />
                </Button>
                <Button
                  size="icon-sm"
                  variant="ghost"
                  onClick={() => handleToggleRead(selectedMessage.id, selectedMessage.isRead)}
                  aria-label={selectedMessage.isRead ? "Mark unread" : "Mark read"}
                  disabled={isPending}
                >
                  {selectedMessage.isRead ? <MailOpen className="size-4" /> : <Mail className="size-4" />}
                </Button>
                <Button
                  size="icon-sm"
                  variant="ghost"
                  onClick={() => handleDelete(selectedMessage.id)}
                  aria-label={selectedMessage.folder === "trash" ? "Delete permanently" : "Move to trash"}
                  disabled={isPending}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </div>

            {/* Detail body */}
            <ScrollArea className="flex-1">
              <div className="px-4 py-4">
                {/* Sender info */}
                <div className="mb-4 flex items-start gap-3">
                  <Avatar size="lg">
                    <AvatarFallback>{getInitials(selectedMessage.fromName)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-sm">{selectedMessage.fromName}</p>
                        <p className="text-muted-foreground text-xs">{selectedMessage.fromEmail}</p>
                      </div>
                      <p className="shrink-0 text-muted-foreground text-xs">
                        {formatMailDateLong(selectedMessage.createdAt)}
                      </p>
                    </div>
                    <p className="mt-0.5 text-muted-foreground text-xs">To: {selectedMessage.to.join(", ") || "—"}</p>
                  </div>
                </div>

                {selectedMessage.labels.length > 0 && (
                  <div className="mb-4 flex flex-wrap gap-1.5">
                    {selectedMessage.labels.map((labelId) => {
                      const labelDef = labels.find((l) => l.id === labelId);
                      if (!labelDef) return null;
                      return (
                        <Badge key={labelId} variant="outline" className="rounded-sm text-xs">
                          <span
                            className={cn("mr-1 size-1.5 rounded-full", LABEL_COLORS[labelId] ?? "bg-muted")}
                            aria-hidden="true"
                          />
                          {labelDef.name}
                        </Badge>
                      );
                    })}
                  </div>
                )}

                <Separator className="mb-4" />

                {/* Body */}
                <div className="whitespace-pre-wrap text-sm leading-relaxed">{selectedMessage.body}</div>
              </div>
            </ScrollArea>
          </>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
            <div className="grid size-12 place-items-center rounded-full bg-muted">
              <Mail className="size-6 text-muted-foreground" />
            </div>
            <div>
              <p className="font-medium text-sm">No message selected</p>
              <p className="text-muted-foreground text-xs">Pick one from the list to read it here</p>
            </div>
          </div>
        )}
      </div>

      {/* ── Compose dialog ── */}
      <Dialog open={isComposeOpen} onOpenChange={setIsComposeOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>New Message</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-1">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="compose-to">To</Label>
              <Input
                id="compose-to"
                type="email"
                value={composeTo}
                onChange={(e) => setComposeTo(e.target.value)}
                placeholder="recipient@example.com"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="compose-subject">Subject</Label>
              <Input
                id="compose-subject"
                value={composeSubject}
                onChange={(e) => setComposeSubject(e.target.value)}
                placeholder="Subject"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="compose-body">Message</Label>
              <Textarea
                id="compose-body"
                value={composeBody}
                onChange={(e) => setComposeBody(e.target.value)}
                placeholder="Write your message…"
                rows={8}
                className="resize-none"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsComposeOpen(false)}>
              Discard
            </Button>
            <Button onClick={handleSendMail} disabled={!composeTo.trim() || !composeSubject.trim() || isPending}>
              <Send />
              Send
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
