"use client";
import Link from "@/components/ui/link";
import { usePathname } from "next/navigation";
import * as Icons from "lucide-react";
import { cn } from "@/lib/utils";

export type NavItem = { href: string; label: string; icon: keyof typeof Icons; exact?: boolean };

export function SideNav({ items, title }: { items: NavItem[]; title: string }) {
  const path = usePathname();
  // Un seul élément actif : la correspondance la plus spécifique
  const matches = items.filter((it) => (it.exact ? path === it.href : path === it.href || path.startsWith(`${it.href}/`)));
  const activeHref = matches.sort((a, b) => b.href.length - a.href.length)[0]?.href;
  return (
    <nav aria-label={title} className="-mx-4 overflow-x-auto px-4 lg:mx-0 lg:overflow-visible lg:px-0">
      <p className="mb-2 hidden px-3 text-xs font-bold uppercase tracking-wider text-muted lg:block">{title}</p>
      <ul className="flex gap-1 pb-2 lg:flex-col lg:pb-0">
        {items.map((it) => {
          const Icon = Icons[it.icon] as Icons.LucideIcon;
          const active = it.href === activeHref;
          return (
            <li key={it.href} className="shrink-0">
              <Link href={it.href} aria-current={active ? "page" : undefined} className={cn("flex items-center gap-2.5 whitespace-nowrap rounded-xl px-3 py-2 text-sm font-semibold transition", active ? "bg-brand-700 text-white" : "text-muted hover:bg-[var(--surface-2)] hover:text-[var(--text)]")}>
                <Icon className="h-4 w-4" aria-hidden /> {it.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
