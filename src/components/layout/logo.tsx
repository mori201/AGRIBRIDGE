import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={cn("h-9 w-9", className)} aria-hidden>
      <rect width="48" height="48" rx="12" fill="#18552f" />
      <path d="M8 33c5-9 11-13 16-13s11 4 16 13" fill="none" stroke="#c9a13b" strokeWidth="3.2" strokeLinecap="round" />
      <path d="M13 33v-6M19 33v-9M29 33v-9M35 33v-6" stroke="#e8f6d5" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M24 20c-4-4-4-9 0-13 4 4 4 9 0 13Z" fill="#7cbf3f" />
      <path d="M6 36h36" stroke="#e8f6d5" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <LogoMark />
      <span className="text-lg font-extrabold tracking-tight">
        Agri<span className="text-brand-600 dark:text-leaf-300">Bridge</span>
      </span>
    </span>
  );
}
