"use client";
import { useEffect, useRef, useState } from "react";
import Link from "@/components/ui/link";
import { AlertTriangle, Bot, Loader2, Send } from "lucide-react";
import { Markdown } from "@/lib/markdown";
import { LANGUAGES } from "@/lib/constants";
import { cn } from "@/lib/utils";

type Msg = { role: "user" | "assistant"; content: string };

const SUGGESTIONS: Record<string, string[]> = {
  fr: ["Quelles opportunités correspondent à mon profil ?", "Comment préparer un dossier de financement ?", "Aide-moi à structurer un budget pour 1 ha de maraîchage", "Quelle formation me recommandes-tu ?"],
  wo: ["Ban financement moo ma gën a dëppoo ?", "Naka laa war a waajal sama dossier ?"],
  en: ["Which opportunities match my profile?", "How do I prepare a funding application?"],
};

export function Chat({ loggedIn, initialConversationId = null, initialMessages = [], initialLanguage = "fr", compact = false }: { loggedIn: boolean; initialConversationId?: string | null; initialMessages?: Msg[]; initialLanguage?: string; compact?: boolean }) {
  const [messages, setMessages] = useState<Msg[]>(initialMessages);
  const [input, setInput] = useState("");
  const [lang, setLang] = useState(initialLanguage);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(initialConversationId);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/assistant")
      .then((r) => r.json())
      .then((j) => setConfigured(Boolean(j.configured)))
      .catch(() => setConfigured(null));
  }, []);
  useEffect(() => endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }), [messages, loading]);

  async function send(text: string) {
    const t = text.trim();
    if (!t || loading) return;
    setError(null);
    setInput("");
    setMessages((m) => [...m, { role: "user", content: t }]);
    setLoading(true);
    try {
      const res = await fetch("/api/assistant", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ message: t, conversationId, language: lang }) });
      const json = await res.json();
      if (json.conversationId) setConversationId(json.conversationId);
      if (!res.ok) {
        setError(json.error ?? "Erreur inattendue.");
        if (json.notConfigured) setConfigured(false);
      } else setMessages((m) => [...m, { role: "assistant", content: json.reply }]);
    } catch {
      setError("Connexion impossible. Vérifiez votre réseau et réessayez.");
    } finally {
      setLoading(false);
    }
  }

  if (!loggedIn) {
    return (
      <div className="flex flex-col items-center gap-3 p-6 text-center">
        <Bot className="h-10 w-10 text-brand-600" />
        <p className="font-semibold">Connectez-vous pour discuter avec l&apos;assistant AgriBridge.</p>
        <p className="text-sm text-muted">L&apos;assistant utilise votre profil pour trouver des opportunités adaptées.</p>
        <div className="flex gap-2">
          <Link href="/connexion" className="rounded-xl bg-brand-700 px-4 py-2 text-sm font-semibold text-white">Connexion</Link>
          <Link href="/inscription" className="rounded-xl border border-base px-4 py-2 text-sm font-semibold">Créer un compte</Link>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex min-h-0 flex-1 flex-col", compact ? "h-full" : "h-[70vh]")}>
      <div className="flex items-center justify-between gap-2 border-b border-base px-4 py-2">
        <label className="flex items-center gap-2 text-xs text-muted">
          Langue
          <select value={lang} onChange={(e) => setLang(e.target.value)} className="rounded-lg border border-base surface px-2 py-1 text-xs">
            {LANGUAGES.map((l) => (
              <option key={l.value} value={l.value}>{l.label}</option>
            ))}
          </select>
        </label>
        {conversationId && (
          <button className="text-xs font-semibold text-brand-700 hover:underline" onClick={() => { setMessages([]); setConversationId(null); setError(null); }}>
            Nouvelle conversation
          </button>
        )}
      </div>
      <div className="flex-1 space-y-3 overflow-y-auto p-4" aria-live="polite">
        {configured === false && (
          <div className="flex gap-2 rounded-xl border border-gold-300 bg-gold-50 p-3 text-sm text-gold-700">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <p>L&apos;assistant IA n&apos;est pas encore configuré sur cette instance. En attendant, consultez le <Link href="/expert" className="underline">répertoire d&apos;experts</Link>.</p>
          </div>
        )}
        {messages.length === 0 && (
          <div className="space-y-3">
            <p className="text-sm text-muted">Bonjour 👋 Je peux vous aider à trouver des financements, préparer un dossier, structurer un budget ou choisir une formation.</p>
            <div className="flex flex-wrap gap-2">
              {(SUGGESTIONS[lang] ?? SUGGESTIONS.fr).map((s) => (
                <button key={s} onClick={() => send(s)} className="rounded-full border border-base px-3 py-1.5 text-left text-xs hover:bg-[var(--surface-2)]" disabled={configured === false}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={cn("max-w-[88%] rounded-2xl px-3.5 py-2.5 text-sm", m.role === "user" ? "ml-auto bg-brand-700 text-white" : "surface-2")}>
            {m.role === "assistant" ? <Markdown source={m.content} /> : <p className="whitespace-pre-wrap">{m.content}</p>}
          </div>
        ))}
        {loading && (
          <div className="surface-2 flex w-fit items-center gap-2 rounded-2xl px-3.5 py-2.5 text-sm text-muted">
            <Loader2 className="h-4 w-4 animate-spin" /> L&apos;assistant réfléchit…
          </div>
        )}
        {error && <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">{error}</p>}
        <div ref={endRef} />
      </div>
      <p className="px-4 pb-1 text-[11px] text-muted">L&apos;IA peut se tromper. Vérifiez les informations auprès des organismes officiels ; pour les traitements phytosanitaires, consultez un expert agréé.</p>
      <form
        className="flex gap-2 border-t border-base p-3"
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
      >
        <label htmlFor="ai-input" className="sr-only">Votre question</label>
        <input id="ai-input" value={input} onChange={(e) => setInput(e.target.value)} maxLength={2000} placeholder="Posez votre question…" className="h-11 flex-1 rounded-xl border border-base surface px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/40" disabled={configured === false} />
        <button type="submit" className="grid h-11 w-11 place-items-center rounded-xl bg-brand-700 text-white disabled:opacity-50" disabled={loading || !input.trim() || configured === false} aria-label="Envoyer">
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
