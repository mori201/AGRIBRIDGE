import { Badge } from "@/components/ui/badge";
import { APPLICATION_STATUSES } from "@/lib/constants";

export function ApplicationStatusBadge({ status }: { status: string }) {
  const s = APPLICATION_STATUSES.find((x) => x.value === status);
  return <Badge tone={s?.tone ?? "gray"}>{s?.label ?? status}</Badge>;
}
