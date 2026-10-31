"use client";
import { useTransition } from "react";
import { setUserRole } from "@/actions/admin";
import { ROLE_LABELS } from "@/lib/constants";

export function RoleSelect({ id, role }: { id: string; role: string }) {
  const [p, start] = useTransition();
  return (
    <select disabled={p} defaultValue={role} aria-label="Rôle" onChange={(e) => { const v = e.target.value; if (v === "admin" && !confirm("Donner les droits administrateur à ce compte ?")) { e.target.value = role; return; } start(async () => { await setUserRole(id, v); }); }} className="h-8 rounded-lg border border-base surface px-2 text-xs">
      {Object.entries(ROLE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
    </select>
  );
}
