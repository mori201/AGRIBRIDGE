"use client";
import Link from "@/components/ui/link";
import { usePathname } from "next/navigation";
import { GraduationCap, HandCoins, Home, MessagesSquare, Store } from "lucide-react";
import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/", label: "Accueil", icon: Home },
  { href: "/opportunites", label: "Financer", icon: HandCoins },
  { href: "/academy", label: "Former", icon: GraduationCap },
  { href: "/market", label: "Marché", icon: Store },
  { href: "/communaute", label: "Réseau", icon: MessagesSquare },
];

export function BottomNav() {
  const path = usePathname();
  return (
    <nav aria-label="Navigation mobile" className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-base bg-[var(--surface)]/95 backdrop-blur lg:hidden">
      <ul className="mx-auto grid max-w-md grid-cols-5">
        {ITEMS.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? path === "/" : path.startsWith(href);
          return (
            <li key={href}>
              <Link href={href} className={cn("flex flex-col items-center gap-0.5 py-2 text-[11px] font-semibold", active ? "text-brand-700 dark:text-leaf-300" : "text-muted")} aria-current={active ? "page" : undefined}>
                <Icon className="h-5 w-5" aria-hidden />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
