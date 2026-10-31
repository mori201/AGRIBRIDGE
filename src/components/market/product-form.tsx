"use client";
import { useState } from "react";
import Image from "next/image";
import { X } from "lucide-react";
import { ActionForm, SubmitButton, fieldError } from "@/components/forms";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { saveProduct } from "@/actions/market";
import { REGIONS } from "@/lib/constants";
import type { Product } from "@/lib/types";

export function ProductForm({ categories, product, defaultRegion }: { categories: { id: number; name: string }[]; product?: Product; defaultRegion?: string | null }) {
  const [kept, setKept] = useState<string[]>(product?.images ?? []);
  return (
    <ActionForm action={saveProduct} refresh={Boolean(product)}>
      {(s) => (
        <div className="grid gap-4 sm:grid-cols-2">
          {product && <input type="hidden" name="id" value={product.id} />}
          <Field label="Titre de l'annonce" htmlFor="title" error={fieldError(s, "title")} className="sm:col-span-2"><Input id="title" name="title" defaultValue={product?.title} required maxLength={150} placeholder="Ex. Oignons de Galmi — 2 tonnes" /></Field>
          <Field label="Catégorie" htmlFor="category_id" error={fieldError(s, "category_id")}><Select id="category_id" name="category_id" defaultValue={product?.category_id ?? ""} required><option value="">Choisir…</option>{categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</Select></Field>
          <Field label="Région" htmlFor="region" error={fieldError(s, "region")}><Select id="region" name="region" defaultValue={product?.region ?? defaultRegion ?? ""} required><option value="">Choisir…</option>{REGIONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}</Select></Field>
          <Field label="Prix (FCFA)" htmlFor="price_fcfa" error={fieldError(s, "price_fcfa")}><Input id="price_fcfa" name="price_fcfa" inputMode="numeric" defaultValue={product?.price_fcfa} required /></Field>
          <Field label="Unité" htmlFor="unit" hint="kg, tonne, sac, unité, botte…"><Input id="unit" name="unit" defaultValue={product?.unit ?? "kg"} required maxLength={30} /></Field>
          <Field label="Quantité disponible" htmlFor="quantity" error={fieldError(s, "quantity")}><Input id="quantity" name="quantity" inputMode="decimal" defaultValue={product?.quantity ?? ""} /></Field>
          <Field label="Localité" htmlFor="location"><Input id="location" name="location" defaultValue={product?.location ?? ""} maxLength={150} placeholder="Ex. Sangalkam" /></Field>
          <Field label="Numéro WhatsApp (facultatif, affiché aux membres connectés)" htmlFor="whatsapp" error={fieldError(s, "whatsapp")}><Input id="whatsapp" name="whatsapp" type="tel" defaultValue={product?.whatsapp ?? ""} placeholder="+221 77 000 00 00" /></Field>
          {product && (
            <Field label="Statut" htmlFor="status"><Select id="status" name="status" defaultValue={product.status === "removed" ? "hidden" : product.status}><option value="active">Active</option><option value="sold">Vendu</option><option value="hidden">Masquée</option></Select></Field>
          )}
          <Field label="Description" htmlFor="description" className="sm:col-span-2"><Textarea id="description" name="description" defaultValue={product?.description ?? ""} rows={5} maxLength={5000} placeholder="Qualité, conditionnement, modalités de livraison…" /></Field>
          <div className="sm:col-span-2">
            <p className="mb-1.5 text-sm font-semibold">Photos (4 max., JPG/PNG/WebP, 3 Mo chacune)</p>
            {kept.length > 0 && (
              <div className="mb-2 flex flex-wrap gap-2">
                {kept.map((u) => (
                  <div key={u} className="relative h-20 w-20 overflow-hidden rounded-xl">
                    <input type="hidden" name="keep_images" value={u} />
                    <Image src={u} alt="" fill sizes="80px" className="object-cover" />
                    <button type="button" onClick={() => setKept((k) => k.filter((x) => x !== u))} className="absolute right-1 top-1 rounded-full bg-black/60 p-0.5 text-white" aria-label="Retirer la photo"><X className="h-3.5 w-3.5" /></button>
                  </div>
                ))}
              </div>
            )}
            <Input name="images" type="file" accept="image/jpeg,image/png,image/webp" multiple className="pt-2" disabled={kept.length >= 4} />
          </div>
          <div className="sm:col-span-2"><SubmitButton size="lg" pendingText="Publication…">{product ? "Enregistrer les modifications" : "Publier l'annonce"}</SubmitButton></div>
        </div>
      )}
    </ActionForm>
  );
}
