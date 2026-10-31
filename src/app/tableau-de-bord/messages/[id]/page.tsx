import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Avatar } from "@/components/ui/misc";
import { CONV_SELECT, type Conv } from "@/lib/conversations";
import { MessageComposer, MessagesLive } from "./client";
import { ReportButton } from "@/components/report-button";

export const metadata: Metadata = { title: "Conversation" };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const { profile } = await requireUser();
  const supabase = await createClient();
  const { data } = await supabase.from("conversations").select(CONV_SELECT).eq("id", id).maybeSingle();
  if (!data) notFound();
  const c = data as unknown as Conv;
  const other = c.user_a === profile.id ? c.ub : c.ua;
  const { data: msgs } = await supabase.from("messages").select("id,sender_id,content,created_at,read_at").eq("conversation_id", id).order("id", { ascending: true }).limit(300);
  await supabase.from("messages").update({ read_at: new Date().toISOString() }).eq("conversation_id", id).neq("sender_id", profile.id).is("read_at", null);
  await supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("link", `/tableau-de-bord/messages/${id}`).is("read_at", null);
  return (
    <div className="surface flex h-[calc(100dvh-10rem)] flex-col overflow-hidden rounded-2xl border border-base">
      <div className="flex items-center gap-3 border-b border-base p-3">
        <Link href="/tableau-de-bord/messages" aria-label="Retour" className="rounded-lg p-1.5 hover:bg-[var(--surface-2)]"><ArrowLeft className="h-5 w-5" /></Link>
        <Avatar name={other?.full_name} src={other?.avatar_url} size={36} />
        <div className="min-w-0 flex-1">
          <Link href={`/membres/${other?.id}`} className="font-bold hover:underline">{other?.full_name}</Link>
          {c.products && <p className="truncate text-xs text-muted">{c.products.title}</p>}
        </div>
        <ReportButton targetType="profile" targetId={other?.id ?? ""} />
      </div>
      <MessagesLive conversationId={id} me={profile.id} initial={msgs ?? []} />
      <MessageComposer conversationId={id} />
    </div>
  );
}
