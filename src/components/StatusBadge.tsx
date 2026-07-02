import {
  PLAYER_STATUS_LABELS,
  CONTRACT_STATUS_LABELS,
  REPRESENTATION_STATUS_LABELS,
  TASK_PRIORITY_LABELS,
  TASK_STATUS_LABELS,
  DEAL_STATUS_LABELS,
} from "@/lib/constants";

function toneFor(kind: string, value: string): string {
  const dangerSet = ["LOST", "ENDED", "CANCELLED", "CRITICAL"];
  const okSet = ["ACTIVE_CLIENT", "ACTIVE", "DONE", "WON"];
  const warnSet = ["NEGOTIATION", "IN_NEGOTIATION", "TRIAL", "HIGH", "MONITORING"];
  if (dangerSet.includes(value)) return "badge-danger";
  if (okSet.includes(value)) return "badge-ok";
  if (warnSet.includes(value)) return "badge-warn";
  return "badge-neutral";
}

const LABEL_MAPS: Record<string, Record<string, string>> = {
  player: PLAYER_STATUS_LABELS,
  contract: CONTRACT_STATUS_LABELS,
  representation: REPRESENTATION_STATUS_LABELS,
  taskPriority: TASK_PRIORITY_LABELS,
  taskStatus: TASK_STATUS_LABELS,
  deal: DEAL_STATUS_LABELS,
};

export default function StatusBadge({ kind, value }: { kind: keyof typeof LABEL_MAPS; value: string }) {
  const label = LABEL_MAPS[kind]?.[value] ?? value;
  return <span className={`badge ${toneFor(kind, value)}`}>{label}</span>;
}
