"use client";
import { useState, useTransition } from "react";
import Link from "next/link";
import { Award, Heart, Loader2, Play } from "lucide-react";
import { Button, LinkButton } from "@/components/ui/button";
import { claimCertificate, enroll, toggleFavoriteCourse } from "@/actions/academy";

export function CourseActions({ courseId, slug, enrolled, favorite, loggedIn, premium, premiumLocked, startHref, eligible, certificate }: { courseId: string; slug: string; enrolled: boolean; favorite: boolean; loggedIn: boolean; premium: boolean; premiumLocked: boolean; startHref: string | null; eligible: boolean; certificate: string | null }) {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [cert, setCert] = useState(certificate);
  if (!loggedIn) return <LinkButton href={`/connexion?next=/academy/${slug}`} className="w-full" size="lg">Se connecter pour commencer</LinkButton>;
  return (
    <div className="space-y-2">
      {cert ? (
        <LinkButton href={`/certificats/${cert}`} variant="gold" className="w-full" size="lg"><Award className="h-4 w-4" /> Voir mon certificat</LinkButton>
      ) : eligible ? (
        <Button variant="gold" className="w-full" size="lg" disabled={pending} onClick={() => start(async () => { const r = await claimCertificate(courseId, slug); if (r.ok && r.data) setCert(r.data.code); else if (!r.ok) setMsg({ ok: false, text: r.error }); })}>
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Award className="h-4 w-4" />} Obtenir mon certificat
        </Button>
      ) : enrolled && startHref ? (
        <LinkButton href={startHref} className="w-full" size="lg"><Play className="h-4 w-4" /> Continuer</LinkButton>
      ) : (
        <Button className="w-full" size="lg" disabled={pending || premiumLocked} onClick={() => start(async () => { const r = await enroll(courseId, slug); setMsg(r.ok ? { ok: true, text: r.message ?? "" } : { ok: false, text: r.error }); })}>
          {pending && <Loader2 className="h-4 w-4 animate-spin" />} {premium && premiumLocked ? "Réservé aux membres premium" : "Commencer la formation"}
        </Button>
      )}
      <Button variant="ghost" size="sm" className="w-full" onClick={() => start(async () => { await toggleFavoriteCourse(courseId, slug, !favorite); })} aria-pressed={favorite}>
        <Heart className={`h-4 w-4 ${favorite ? "fill-red-500 text-red-500" : ""}`} /> {favorite ? "Dans mes favoris" : "Ajouter aux favoris"}
      </Button>
      {msg && <p className={`text-sm ${msg.ok ? "text-brand-700" : "text-red-600"}`} role="status">{msg.text}</p>}
      {premiumLocked && <Link href="/contact" className="block text-center text-xs underline">Demander l&apos;accès premium</Link>}
    </div>
  );
}
