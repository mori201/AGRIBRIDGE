import type { Metadata } from "next";
import Link from "@/components/ui/link";
import { ArrowLeft, MessageSquare } from "lucide-react";
import { getUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Chat } from "@/components/assistant/chat";
import { relativeTime } from "@/lib/format";

export const metadata: Metadata = { title: "Assistant IA AgriBridge" };

export default async function Page({ searchParams }: { searchParams: Promise<{ c?: string }> }) {
  const { c } = await searchParams;
  const user = await getUser();
  let convs: { id: string; title: string; updated_at: string }[] = [];
  let initial: { role: "user" | "assistant"; content: string }[] = [];
  let lang = "fr";
  if (user) {
    const supabase = await createClient();
    convs = (await supabase.from("ai_conversations").select("id,title,updated_at,language").order("updated_at", { ascending: false }).limit(20)).data ?? [];
    if (c && /^[0-9a-f-]{36}$/i.test(c)) {
      const { data } = await supabase.from("ai_messages").select("role,content").eq("conversation_id", c).order("id");
      initial = (data ?? []) as typeof initial;
      lang = (convs.find((x) => x.id === c) as { language?: string } | undefined)?.language ?? "fr";
    }
  }
  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <Link href="/expert" className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-[var(--text)]"><ArrowLeft className="h-4 w-4" /> AgriExpert</Link>
      <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
        <aside className="surface hidden h-fit rounded-2xl border border-base p-3 lg:block">
          <Link href="/expert/assistant" className="mb-2 block rounded-xl bg-brand-700 px-3 py-2 text-center text-sm font-semibold text-white">Nouvelle conversation</Link>
          <p className="px-2 py-1 text-xs font-bold uppercase text-muted">Historique</p>
          <ul className="space-y-0.5">
            {convs.map((x) => (
              <li key={x.id}><Link href={`/expert/assistant?c=${x.id}`} className={`flex items-start gap-2 rounded-lg px-2 py-2 text-sm hover:bg-[var(--surface-2)] ${x.id === c ? "bg-[var(--surface-2)] font-semibold" : ""}`}><MessageSquare className="mt-0.5 h-3.5 w-3.5 shrink-0" /><span className="min-w-0"><span className="line-clamp-1">{x.title}</span><span className="block text-xs text-muted">{relativeTime(x.updated_at)}</span></span></Link></li>
            ))}
            {convs.length === 0 && <li className="px-2 text-sm text-muted">Aucune conversation.</li>}
          </ul>
        </aside>
        <div className="surface flex flex-col overflow-hidden rounded-2xl border border-base">
          <Chat key={c ?? "new"} loggedIn={Boolean(user)} initialConversationId={initial.length ? c ?? null : null} initialMessages={initial} initialLanguage={lang} />
        </div>
      </div>
    </div>
  );
}
