"use client";
import { useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";
import { ActionForm, SubmitButton } from "@/components/forms";
import { sendMessage } from "@/actions/market";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type M = { id: number; sender_id: string; content: string; created_at: string };

export function MessagesLive({ conversationId, me, initial }: { conversationId: string; me: string; initial: M[] }) {
  const [msgs, setMsgs] = useState<M[]>(initial);
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => setMsgs(initial), [initial]);
  useEffect(() => {
    // Rafraîchissement léger (adapté aux connexions lentes) : on ne récupère que les nouveaux messages
    const supabase = createClient();
    const t = setInterval(async () => {
      const last = msgs.at(-1)?.id ?? 0;
      const { data } = await supabase.from("messages").select("id,sender_id,content,created_at").eq("conversation_id", conversationId).gt("id", last).order("id");
      if (data?.length) setMsgs((m) => [...m, ...(data as M[]).filter((d) => !m.some((x) => x.id === d.id))]);
    }, 8000);
    return () => clearInterval(t);
  }, [conversationId, msgs]);
  useEffect(() => end.current?.scrollIntoView({ block: "end" }), [msgs.length]);
  return (
    <div className="flex-1 space-y-2 overflow-y-auto p-4" aria-live="polite">
      {msgs.length === 0 && <p className="text-center text-sm text-muted">Démarrez la conversation.</p>}
      {msgs.map((m) => (
        <div key={m.id} className={cn("max-w-[80%] rounded-2xl px-3.5 py-2 text-sm", m.sender_id === me ? "ml-auto bg-brand-700 text-white" : "surface-2")}>
          <p className="whitespace-pre-wrap break-words">{m.content}</p>
          <p className={cn("mt-0.5 text-[10px]", m.sender_id === me ? "text-brand-100" : "text-muted")}>{new Date(m.created_at).toLocaleString("fr-FR", { hour: "2-digit", minute: "2-digit", day: "numeric", month: "short" })}</p>
        </div>
      ))}
      <div ref={end} />
    </div>
  );
}

export function MessageComposer({ conversationId }: { conversationId: string }) {
  return (
    <ActionForm action={sendMessage} resetOnSuccess className="border-t border-base p-3">
      <div className="flex gap-2">
        <input type="hidden" name="conversation_id" value={conversationId} />
        <label htmlFor="msg" className="sr-only">Message</label>
        <input id="msg" name="content" required maxLength={4000} autoComplete="off" placeholder="Votre message…" className="h-11 flex-1 rounded-xl border border-base surface px-3 text-sm" />
        <SubmitButton pendingText="" size="md"><Send className="h-4 w-4" /><span className="sr-only">Envoyer</span></SubmitButton>
      </div>
    </ActionForm>
  );
}
