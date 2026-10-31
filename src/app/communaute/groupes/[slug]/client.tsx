"use client";
import { useTransition } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toggleGroup } from "@/actions/community";

export function JoinGroupButton({ groupId, slug, member }: { groupId: string; slug: string; member: boolean }) {
  const [p, start] = useTransition();
  return (
    <Button variant={member ? "outline" : "gold"} size="sm" className={member ? "border-white/40 bg-transparent text-white hover:bg-white/10" : ""} disabled={p} onClick={() => start(async () => { await toggleGroup(groupId, slug); })}>
      {p && <Loader2 className="h-4 w-4 animate-spin" />} {member ? "Quitter le groupe" : "Rejoindre le groupe"}
    </Button>
  );
}
