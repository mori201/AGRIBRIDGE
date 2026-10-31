import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/misc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ActionButton } from "@/components/admin/action-button";
import { setContactHandled } from "@/actions/admin";
import { isAiConfigured, AI_PROVIDER, AI_MODEL } from "@/lib/ai";
import { relativeTime } from "@/lib/format";
import { CategoryForm, SettingsForm } from "./client";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Paramètres de la plateforme" };

export default async function Page() {
  const supabase = await createClient();
  const [{ data: settings }, { data: contacts }, { data: logs }, { data: oc }, { data: pc }] = await Promise.all([
    supabase.from("platform_settings").select("key,value"),
    supabase.from("contact_messages").select("*").eq("handled", false).order("created_at", { ascending: false }).limit(30),
    supabase.from("audit_logs").select("id,actor_id,action,entity,entity_id,created_at").order("created_at", { ascending: false }).limit(40),
    supabase.from("opportunity_categories").select("id,name").order("id"),
    supabase.from("product_categories").select("id,name").order("id"),
  ]);
  const get = (k: string) => (settings ?? []).find((s) => s.key === k)?.value ?? {};
  return (
    <div className="space-y-5">
      <PageHeader title="Paramètres de la plateforme" />
      <Card><CardHeader><CardTitle>Général et limites</CardTitle></CardHeader><CardContent><SettingsForm limits={get("limits")} general={get("general")} /></CardContent></Card>
      <Card>
        <CardHeader><CardTitle>Intégrations</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>Assistant IA : {isAiConfigured ? <Badge tone="green">Configuré ({AI_PROVIDER} · {AI_MODEL})</Badge> : <Badge tone="gold">Non configuré — définir AI_API_KEY</Badge>}</p>
          <p>Paiements Wave / Orange Money : <Badge tone="gray">Non intégrés</Badge></p>
          <p>E-mails transactionnels : <Badge tone="gray">SMTP Supabase par défaut — configurer un SMTP personnalisé</Badge></p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Catégories</CardTitle></CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 text-sm">
          <div><p className="font-semibold">Types d&apos;opportunités</p><p className="text-muted">{(oc ?? []).map((c) => c.name).join(" · ")}</p><CategoryForm table="opportunity_categories" /></div>
          <div><p className="font-semibold">Catégories AgriMarket</p><p className="text-muted">{(pc ?? []).map((c) => c.name).join(" · ")}</p><CategoryForm table="product_categories" /></div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Messages de contact non traités ({contacts?.length ?? 0})</CardTitle></CardHeader>
        <CardContent>
          <ul className="space-y-3 text-sm">{(contacts ?? []).map((c) => <li key={c.id} className="rounded-xl border border-base p-3"><div className="flex justify-between gap-2"><p className="font-semibold">{c.subject}</p><ActionButton tone="success" action={setContactHandled.bind(null, c.id)}>Traité</ActionButton></div><p className="text-xs text-muted">{c.name} · <a className="underline" href={`mailto:${c.email}`}>{c.email}</a> · {relativeTime(c.created_at)}</p><p className="mt-1 whitespace-pre-line">{c.message}</p></li>)}</ul>
          {(contacts ?? []).length === 0 && <p className="text-sm text-muted">Aucun message en attente.</p>}
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Journal d&apos;audit</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto"><table className="w-full min-w-[520px] text-xs"><tbody>{(logs ?? []).map((l) => <tr key={l.id} className="border-t border-base"><td className="py-1.5">{relativeTime(l.created_at)}</td><td>{l.action}</td><td>{l.entity}</td><td className="font-mono">{l.entity_id?.slice(0, 8)}</td><td className="font-mono text-muted">{l.actor_id?.slice(0, 8) ?? "système"}</td></tr>)}</tbody></table></CardContent>
      </Card>
    </div>
  );
}
