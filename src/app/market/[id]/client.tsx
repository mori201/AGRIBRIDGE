"use client";
import { useState, useTransition } from "react";
import { Heart, Loader2, MessageCircle } from "lucide-react";
import { Button, LinkButton } from "@/components/ui/button";
import { Textarea } from "@/components/ui/field";
import { contactUser, toggleProductFavorite } from "@/actions/market";
import { whatsappLink } from "@/lib/format";

export function ContactSeller({ sellerId, productId, title, whatsapp, loggedIn, disabled }: { sellerId: string; productId: string; title: string; whatsapp: string | null; loggedIn: boolean; disabled: boolean }) {
  const [open, setOpen] = useState(false);
  const [msg, setMsg] = useState(`Bonjour, votre annonce « ${title} » sur AgriBridge m'intéresse. Est-elle toujours disponible ?`);
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  if (!loggedIn) return <LinkButton href={`/connexion?next=/market/${productId}`} className="w-full">Se connecter pour contacter</LinkButton>;
  return (
    <div className="space-y-2">
      {whatsapp && !disabled && (
        <a href={whatsappLink(whatsapp, `Bonjour, je vous contacte depuis AgriBridge au sujet de « ${title} ».`)} target="_blank" rel="noopener noreferrer" className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] font-semibold text-white hover:brightness-95">
          <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm5.3 14.2c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .2-3.3-.7-2.8-1.1-4.6-4-4.7-4.2-.1-.2-1.1-1.5-1.1-2.9s.7-2.1 1-2.4c.3-.3.6-.3.8-.3h.6c.2 0 .4 0 .6.5l.9 2.1c.1.2.1.4 0 .6l-.4.6-.4.4c-.1.1-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.2 1 2.1 1.3 2.4 1.5.3.1.5.1.6-.1l.9-1.1c.2-.3.4-.2.7-.1l2 .9c.3.2.5.2.6.4 0 .1 0 .7-.1 1.3Z"/></svg>
          Contacter sur WhatsApp
        </a>
      )}
      {!open ? (
        <Button variant={whatsapp ? "outline" : "primary"} className="w-full" disabled={disabled} onClick={() => setOpen(true)}><MessageCircle className="h-4 w-4" /> Envoyer un message</Button>
      ) : (
        <div className="space-y-2">
          <Textarea value={msg} onChange={(e) => setMsg(e.target.value)} maxLength={4000} aria-label="Votre message" />
          <Button className="w-full" disabled={pending || !msg.trim()} onClick={() => start(async () => { const r = await contactUser(sellerId, productId, msg); if (r && !r.ok) setErr(r.error); })}>
            {pending && <Loader2 className="h-4 w-4 animate-spin" />} Envoyer
          </Button>
          {err && <p className="text-sm text-red-600">{err}</p>}
        </div>
      )}
    </div>
  );
}

export function FavoriteProduct({ id, fav }: { id: string; fav: boolean }) {
  const [on, setOn] = useState(fav);
  const [pending, start] = useTransition();
  return (
    <button disabled={pending} aria-pressed={on} onClick={() => start(async () => { setOn(!on); await toggleProductFavorite(id); })} className="inline-flex items-center gap-1.5 text-sm font-semibold">
      <Heart className={`h-4 w-4 ${on ? "fill-red-500 text-red-500" : ""}`} /> {on ? "Dans mes favoris" : "Ajouter aux favoris"}
    </button>
  );
}
