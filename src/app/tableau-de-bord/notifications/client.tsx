"use client";
import { useTransition } from "react";
import { CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { markNotificationsRead } from "@/actions/common";

export function MarkAllRead() {
  const [pending, start] = useTransition();
  return (
    <Button variant="outline" size="sm" disabled={pending} onClick={() => start(async () => { await markNotificationsRead(); })}>
      <CheckCheck className="h-4 w-4" /> Tout marquer comme lu
    </Button>
  );
}
