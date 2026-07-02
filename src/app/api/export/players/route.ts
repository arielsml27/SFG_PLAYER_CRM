import { NextRequest } from "next/server";
import { getPlayersList } from "@/lib/data";
import { PLAYER_STATUS_LABELS } from "@/lib/constants";
import { formatDate, calcAge } from "@/lib/format";

function csvEscape(value: unknown): string {
  const s = value === null || value === undefined ? "" : String(value);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const players = await getPlayersList({
    q: searchParams.get("q") ?? undefined,
    status: searchParams.get("status") ?? undefined,
    position: searchParams.get("position") ?? undefined,
  });

  const headers = [
    "שם פרטי",
    "שם משפחה",
    "שם עברית",
    "גיל",
    "תאריך לידה",
    "עמדה",
    "רגל חזקה",
    "מועדון",
    "מדינה",
    "סטטוס שחקן",
    "סטטוס ייצוג",
    "סיום חוזה מועדון",
    "סיום ייצוג",
    "דירוג פנימי",
    "פוטנציאל",
    "פעולה הבאה",
  ];

  const rows = players.map((p) => [
    p.firstName,
    p.lastName,
    p.fullNameHebrew ?? "",
    calcAge(p.dateOfBirth) ?? "",
    formatDate(p.dateOfBirth),
    p.mainPosition,
    p.strongFoot ?? "",
    p.club?.name ?? "",
    p.currentCountry ?? "",
    PLAYER_STATUS_LABELS[p.status] ?? p.status,
    p.representationStatus,
    p.latestContract ? formatDate(p.latestContract.endDate) : "",
    p.latestRepresentation ? formatDate(p.latestRepresentation.endDate) : "",
    p.internalRating ?? "",
    p.potentialRating ?? "",
    p.nextAction ?? "",
  ]);

  const csv = "\uFEFF" + [headers, ...rows].map((r) => r.map(csvEscape).join(",")).join("\n");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="players-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
