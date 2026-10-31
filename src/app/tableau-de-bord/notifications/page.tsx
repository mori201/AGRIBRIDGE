import type { Metadata } from "next";
import Link from "@/components/ui/link";
import { Bell } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { EmptyState, PageHeader } from "@/components/ui/misc";
import { relativeTime } from "@/lib/format";
import { MarkAllRead } from "./client";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Notifications" };

export default async function Page() {
  await requireUser();
  const supabase = await createClient();
  const { data } = await supabase.from("notifications").select("*").order("created_at", { ascending: false }).limit(100);
  const unread = (data ?? []).filter((n) => !n.read_at).length;
  return (
    <div>
      <PageHeader title="Notifications" description={unread ? `${unread} non lue(s)` : "Vous êtes à jour."} actions={unread > 0 ? <MarkAllRead /> : undefined} />
      {(data ?? []).length === 0 ? (
        <EmptyState icon={Bell} title="Aucune notification" description="Vous serez notifié des nouvelles opportunités, réponses et messages." />
      ) : (
        <ul className="surface divide-y divide-[var(--border)] rounded-2xl border border-base">
          {(data ?? []).map((n) => (
            <li key={n.id} className={cn("flex gap-3 p-4", !n.read_at && "bg-brand-50/60 dark:bg-brand-900/20")}>
              <span className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", n.read_at ? "bg-transparent" : "bg-gold-500")} aria-hidden />
              <div className="min-w-0 flex-1">
                {n.link ? <Link href={n.link} className="font-semibold hover:underline">{n.title}</Link> : <p className="font-semibold">{n.title}</p>}
                {n.body && <p className="text-sm text-muted">{n.body}</p>}
                <p className="mt-0.5 text-xs text-muted">{relativeTime(n.created_at)}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
