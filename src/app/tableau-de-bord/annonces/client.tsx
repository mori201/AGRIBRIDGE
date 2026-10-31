"use client";
import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { deleteProduct } from "@/actions/market";

export function DeleteProductButton({ id }: { id: string }) {
  const [pending, start] = useTransition();
  return (
    <button aria-label="Supprimer l'annonce" disabled={pending} className="rounded-lg p-2 text-red-600 hover:bg-red-50" onClick={() => confirm("Supprimer définitivement cette annonce ?") && start(async () => { await deleteProduct(id); })}>
      <Trash2 className="h-4 w-4" />
    </button>
  );
}
