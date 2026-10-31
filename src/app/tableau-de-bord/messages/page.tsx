import type { Metadata } from "next";
import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Avatar, EmptyState, PageHeader } from "@/components/ui/misc";
import { relativeTime } from "@/lib/format";
import { CONV_SELECT, type Conv } from "@/lib/conversations";

export const metadata: Metadata = { title: "Messages" };


export default async function Page() {
  const { profile } = await requireUser();
  const supabase = await createClient();
  const { data } = await supabase.from("conversations").select(CONV_SELECT).or(`user_a.eq.${profile.id},user_b.eq.${profile.id}`).order("last_message_at", { ascending: false });
  const convs = (data ?? []) as unknown as Conv[];
  const { data: unread } = await supabase.from("messages").select("conversation_id").is("read_at", null).neq("sender_id", profile.id);
  const unreadSet = new Set((unread ?? []).map((u) => u.conversation_id));
  return (
    <div>
      <PageHeader title="Messages" description="Échanges privés avec les vendeurs, acheteurs et membres." />
      {convs.length === 0 ? (
        <EmptyState icon={MessageCircle} title="Aucune conversation" description="Contactez un vendeur depuis AgriMarket ou un membre depuis son profil." />
      ) : (
        <ul className="surface divide-y divide-[var(--border)] rounded-2xl border border-base">
          {convs.map((c) => {
            const other = c.user_a === profile.id ? c.ub : c.ua;
            return (
              <li key={c.id}>
                <Link href={`/tableau-de-bord/messages/${c.id}`} className="flex items-center gap-3 p-4 hover:bg-[var(--surface-2)]">
                  <Avatar name={other?.full_name} src={other?.avatar_url} size={44} />
                  <div className="min-w-0 flex-1">
                    <p className="font-bold">{other?.full_name ?? "Membre"}</p>
                    {c.products && <p className="truncate text-sm text-muted">À propos de : {c.products.title}</p>}
                  </div>
                  <div className="text-right text-xs text-muted">{relativeTime(c.last_message_at)}{unreadSet.has(c.id) && <span className="ml-auto mt-1 block h-2.5 w-2.5 rounded-full bg-gold-500" aria-label="Non lu" />}</div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
