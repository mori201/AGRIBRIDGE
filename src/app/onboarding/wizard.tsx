"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, ArrowRight, Check, Loader2 } from "lucide-react";
import { ProfileSchema, type ProfileInput } from "@/lib/schemas/profile";
import { saveProfile } from "@/actions/profile";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { Notice, Progress } from "@/components/ui/misc";
import { EXPERIENCE_LEVELS, LANGUAGES, PROFILE_TYPES, PROJECT_STAGES, REGIONS, SECTORS } from "@/lib/constants";
import { cn } from "@/lib/utils";

const STEPS = ["Vous", "Activité", "Projet", "Préférences"] as const;
const STEP_FIELDS: (keyof ProfileInput)[][] = [["full_name", "role", "region"], ["sectors", "experience_level"], ["project_type", "project_stage", "funding_need", "funding_amount"], ["preferred_language", "phone", "bio"]];

export function OnboardingWizard({ initial, isAdmin }: { initial: Partial<ProfileInput>; isAdmin: boolean }) {
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const router = useRouter();
  const form = useForm<ProfileInput>({
    resolver: zodResolver(ProfileSchema) as never,
    defaultValues: { sectors: [], preferred_language: "fr", ...initial } as ProfileInput,
    mode: "onTouched",
  });
  const { register, control, formState: { errors }, trigger, watch, getValues } = form;
  const role = watch("role");
  const needFunding = watch("funding_need");

  const next = async () => {
    if (await trigger(STEP_FIELDS[step])) setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };
  const submit = (finish: boolean) =>
    start(async () => {
      setError(null);
      const ok = await trigger();
      if (!ok) return;
      const r = await saveProfile({ ...getValues(), complete: true });
      if (!r.ok) setError(r.error);
      else router.push(finish ? (role === "institution" ? "/partenaire" : role === "expert" ? "/tableau-de-bord/demandes-expert" : "/tableau-de-bord?bienvenue=1") : "/tableau-de-bord");
    });

  return (
    <div>
      <p className="text-sm font-semibold text-brand-700">Étape {step + 1} sur {STEPS.length}</p>
      <h1 className="mt-1 text-2xl font-extrabold">Personnalisons votre expérience</h1>
      <p className="mt-1 text-muted">Ces informations servent uniquement à vous proposer des opportunités et formations adaptées. Vous pourrez les modifier à tout moment.</p>
      <Progress value={((step + 1) / STEPS.length) * 100} className="mt-4" />
      <ol className="mt-3 flex justify-between text-xs font-semibold text-muted">
        {STEPS.map((s, i) => <li key={s} className={cn(i <= step && "text-brand-700")}>{s}</li>)}
      </ol>
      {error && <Notice tone="error" className="mt-4">{error}</Notice>}
      <form className="surface mt-6 space-y-5 rounded-2xl border border-base p-5" onSubmit={(e) => { e.preventDefault(); if (step < STEPS.length - 1) next(); else submit(true); }} noValidate>
        {step === 0 && (
          <>
            <Field label="Nom complet" htmlFor="full_name" error={errors.full_name?.message}><Input id="full_name" {...register("full_name")} autoComplete="name" /></Field>
            {!isAdmin && (
              <Field label="Type de profil" htmlFor="role" error={errors.role?.message}>
                <Select id="role" {...register("role")}>{PROFILE_TYPES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}</Select>
              </Field>
            )}
            <Field label="Région" htmlFor="region" error={errors.region?.message}>
              <Select id="region" {...register("region")}><option value="">Sélectionnez…</option>{REGIONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}</Select>
            </Field>
          </>
        )}
        {step === 1 && (
          <>
            <fieldset>
              <legend className="mb-2 text-sm font-semibold">Secteurs agricoles (jusqu&apos;à 6)</legend>
              <Controller
                control={control}
                name="sectors"
                render={({ field }) => (
                  <div className="flex flex-wrap gap-2">
                    {SECTORS.map((s) => {
                      const on = field.value?.includes(s.value);
                      return (
                        <button type="button" key={s.value} aria-pressed={on} onClick={() => field.onChange(on ? field.value.filter((v: string) => v !== s.value) : [...(field.value ?? []), s.value])} className={cn("rounded-full border px-3 py-1.5 text-sm font-medium transition", on ? "border-brand-600 bg-brand-600 text-white" : "border-base hover:bg-[var(--surface-2)]")}>
                          {on && <Check className="mr-1 inline h-3.5 w-3.5" />}{s.label}
                        </button>
                      );
                    })}
                  </div>
                )}
              />
              {errors.sectors && <p className="mt-1 text-xs text-red-600">{errors.sectors.message as string}</p>}
            </fieldset>
            <Field label="Niveau d'expérience" htmlFor="experience_level"><Select id="experience_level" {...register("experience_level")}><option value="">Sélectionnez…</option>{EXPERIENCE_LEVELS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}</Select></Field>
          </>
        )}
        {step === 2 && (
          <>
            <Field label="Votre projet en une phrase" htmlFor="project_type" hint="Ex. : production de poulets de chair à Thiès" error={errors.project_type?.message}><Input id="project_type" {...register("project_type")} maxLength={200} /></Field>
            <Field label="Stade du projet" htmlFor="project_stage"><Select id="project_stage" {...register("project_stage")}><option value="">Sélectionnez…</option>{PROJECT_STAGES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}</Select></Field>
            <Field label="Recherchez-vous un financement ?" htmlFor="funding_need">
              <Select id="funding_need" {...register("funding_need")}><option value="">Je ne sais pas encore</option><option value="true">Oui</option><option value="false">Non</option></Select>
            </Field>
            {String(needFunding) === "true" && (
              <Field label="Montant recherché (FCFA)" htmlFor="funding_amount" error={errors.funding_amount?.message}><Input id="funding_amount" inputMode="numeric" {...register("funding_amount")} placeholder="Ex. 2 000 000" /></Field>
            )}
          </>
        )}
        {step === 3 && (
          <>
            <Field label="Langue préférée" htmlFor="preferred_language"><Select id="preferred_language" {...register("preferred_language")}>{LANGUAGES.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}</Select></Field>
            <Field label="Téléphone (facultatif, jamais affiché publiquement)" htmlFor="phone" error={errors.phone?.message}><Input id="phone" type="tel" inputMode="tel" {...register("phone")} placeholder="+221 77 000 00 00" /></Field>
            <Field label="Courte présentation (facultatif)" htmlFor="bio" error={errors.bio?.message}><Textarea id="bio" {...register("bio")} maxLength={1000} /></Field>
          </>
        )}
        <div className="flex items-center justify-between gap-2 pt-2">
          {step > 0 ? <Button type="button" variant="ghost" onClick={() => setStep((s) => s - 1)}><ArrowLeft className="h-4 w-4" /> Retour</Button> : <Button type="button" variant="ghost" onClick={() => submit(false)} disabled={pending}>Plus tard</Button>}
          <Button type="submit" disabled={pending}>
            {pending && <Loader2 className="h-4 w-4 animate-spin" />}
            {step < STEPS.length - 1 ? <>Continuer <ArrowRight className="h-4 w-4" /></> : "Terminer"}
          </Button>
        </div>
      </form>
    </div>
  );
}
