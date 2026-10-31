"use client";
import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Notice } from "@/components/ui/misc";
import type { ActionResult } from "@/lib/types";
import type { VariantProps } from "class-variance-authority";
import type { buttonVariants } from "@/components/ui/button";

export function SubmitButton({ children, pendingText = "Enregistrement…", className, variant, size, disabled, name, value }: { children: React.ReactNode; pendingText?: string; className?: string; disabled?: boolean; name?: string; value?: string } & VariantProps<typeof buttonVariants>) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" name={name} value={value} disabled={pending || disabled} className={className} variant={variant} size={size} aria-busy={pending}>
      {pending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
      {pending ? pendingText : children}
    </Button>
  );
}

type Action = (prev: ActionResult<unknown> | null, fd: FormData) => Promise<ActionResult<unknown>>;

/**
 * Formulaire relié à une Server Action : affiche les erreurs / confirmations,
 * réinitialise ou redirige après succès.
 */
export function ActionForm({
  action,
  children,
  className,
  resetOnSuccess = false,
  redirectTo,
  refresh = true,
  showSuccess = true,
}: {
  action: Action;
  children: React.ReactNode | ((state: ActionResult<unknown> | null) => React.ReactNode);
  className?: string;
  resetOnSuccess?: boolean;
  redirectTo?: string;
  refresh?: boolean;
  showSuccess?: boolean;
}) {
  const [state, formAction] = useActionState(action, null);
  const ref = useRef<HTMLFormElement>(null);
  const router = useRouter();
  useEffect(() => {
    if (state?.ok) {
      if (resetOnSuccess) ref.current?.reset();
      if (redirectTo) router.push(redirectTo);
      else if (refresh) router.refresh();
    }
  }, [state, resetOnSuccess, redirectTo, refresh, router]);
  return (
    <form ref={ref} action={formAction} className={className} noValidate>
      {state && !state.ok && (
        <Notice tone="error" className="mb-4">
          {state.error}
        </Notice>
      )}
      {state?.ok && showSuccess && state.message && (
        <Notice tone="success" className="mb-4">
          {state.message}
        </Notice>
      )}
      {typeof children === "function" ? children(state) : children}
    </form>
  );
}

export function fieldError(state: ActionResult<unknown> | null, name: string) {
  return state && !state.ok ? state.fieldErrors?.[name]?.[0] : undefined;
}
