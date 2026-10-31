const nf = new Intl.NumberFormat("fr-FR");

export function fcfa(n?: number | null) {
  if (n === null || n === undefined) return "";
  return `${nf.format(n).replace(/ /g, " ")} FCFA`;
}

export function amountRange(min?: number | null, max?: number | null) {
  if (min && max) return `${fcfa(min)} – ${fcfa(max)}`;
  if (max) return `Jusqu'à ${fcfa(max)}`;
  if (min) return `À partir de ${fcfa(min)}`;
  return "Montant non précisé";
}

export function formatDate(d?: string | Date | null, opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "long", year: "numeric" }) {
  if (!d) return "";
  const date = typeof d === "string" ? new Date(d.length === 10 ? `${d}T00:00:00` : d) : d;
  return new Intl.DateTimeFormat("fr-FR", opts).format(date);
}

export function relativeTime(d: string | Date) {
  const date = typeof d === "string" ? new Date(d) : d;
  const diff = (Date.now() - date.getTime()) / 1000;
  const rtf = new Intl.RelativeTimeFormat("fr", { numeric: "auto" });
  if (diff < 60) return "à l'instant";
  if (diff < 3600) return rtf.format(-Math.round(diff / 60), "minute");
  if (diff < 86400) return rtf.format(-Math.round(diff / 3600), "hour");
  if (diff < 86400 * 30) return rtf.format(-Math.round(diff / 86400), "day");
  return formatDate(date);
}

export function daysUntil(deadline?: string | null) {
  if (!deadline) return null;
  const end = new Date(`${deadline}T23:59:59`);
  return Math.ceil((end.getTime() - Date.now()) / 86400000);
}

export type DeadlineStatus = "ouverte" | "bientot" | "cloturee" | "permanente";
export function deadlineStatus(deadline?: string | null): DeadlineStatus {
  const d = daysUntil(deadline);
  if (d === null) return "permanente";
  if (d < 0) return "cloturee";
  if (d <= 10) return "bientot";
  return "ouverte";
}
export const DEADLINE_LABELS: Record<DeadlineStatus, string> = {
  ouverte: "Ouverte",
  bientot: "Bientôt clôturée",
  cloturee: "Clôturée",
  permanente: "Ouverte en continu",
};

export function initials(name?: string | null) {
  return (name ?? "?")
    .replace(/\(.*?\)/g, "")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

export function whatsappLink(phone: string, text: string) {
  const digits = phone.replace(/[^0-9]/g, "");
  const full = digits.startsWith("221") || digits.length > 9 ? digits : `221${digits}`;
  return `https://wa.me/${full}?text=${encodeURIComponent(text)}`;
}
