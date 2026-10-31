"use client";
import { useState, useTransition } from "react";
import { MessageCircle, UserCheck, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toggleFollow } from "@/actions/community";
import { contactUser } from "@/actions/market";

export function FollowButton({ id, following }: { id: string; following: boolean }) {
  const [on, setOn] = useState(following);
  const [p, start] = useTransition();
  return (
    <Button variant={on ? "secondary" : "primary"} size="sm" disabled={p} onClick={() => start(async () => { setOn(!on); await toggleFollow(id); })} aria-pressed={on}>
      {on ? <UserCheck className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />} {on ? "Abonné" : "Suivre"}
    </Button>
  );
}

export function MessageButton({ id }: { id: string }) {
  const [p, start] = useTransition();
  return <Button variant="outline" size="sm" disabled={p} onClick={() => start(async () => { await contactUser(id, null, ""); })}><MessageCircle className="h-4 w-4" /> Message</Button>;
}
