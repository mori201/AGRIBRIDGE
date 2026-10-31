import { cva, type VariantProps } from "class-variance-authority";
import Link from "next/link";
import * as React from "react";
import { cn } from "@/lib/utils";

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-150 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98] whitespace-nowrap",
  {
    variants: {
      variant: {
        primary: "bg-brand-700 text-white hover:bg-brand-800 shadow-sm",
        secondary: "bg-brand-50 text-brand-800 hover:bg-brand-100 dark:bg-brand-900/40 dark:text-brand-100 dark:hover:bg-brand-900/70",
        gold: "bg-gold-500 text-brand-950 hover:bg-gold-600 hover:text-white shadow-sm",
        outline: "border border-base surface hover:bg-[var(--surface-2)]",
        ghost: "hover:bg-[var(--surface-2)]",
        danger: "bg-red-600 text-white hover:bg-red-700",
        link: "text-brand-700 dark:text-brand-300 underline-offset-4 hover:underline px-0",
      },
      size: { sm: "h-9 px-3 text-sm", md: "h-11 px-4 text-sm", lg: "h-12 px-6 text-base", icon: "h-10 w-10" },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

type BaseProps = VariantProps<typeof buttonVariants> & { className?: string };

export function Button({ className, variant, size, ...props }: BaseProps & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}

export function LinkButton({ className, variant, size, href, ...props }: BaseProps & React.ComponentProps<typeof Link>) {
  return <Link href={href} className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
