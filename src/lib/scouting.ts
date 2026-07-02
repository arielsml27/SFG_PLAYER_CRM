import { PHYSICAL_SKILLS, MENTAL_SKILLS, ON_FIELD_BEHAVIOR_SKILLS, BODY_LANGUAGE_SKILLS } from "@/lib/constants";

function avgOf(report: any, keys: string[]): number | null {
  const values = keys.map((k) => report?.[k]).filter((v: unknown): v is number => typeof v === "number");
  if (!values.length) return null;
  return values.reduce((a: number, b: number) => a + b, 0) / values.length;
}

export function buildAttributeRadarData(report: any): { label: string; value: number | null }[] {
  const technicalRatings: Record<string, number> = report?.technicalRatings ? JSON.parse(report.technicalRatings) : {};
  const technicalValues = Object.values(technicalRatings).filter((v): v is number => typeof v === "number");
  const technicalAvg = technicalValues.length
    ? technicalValues.reduce((a, b) => a + b, 0) / technicalValues.length
    : null;

  return [
    { label: "טכני-טקטי", value: technicalAvg },
    { label: "פיזי", value: avgOf(report, PHYSICAL_SKILLS.map(([k]) => k)) },
    { label: "מנטלי", value: avgOf(report, MENTAL_SKILLS.map(([k]) => k)) },
    { label: "התנהגות במגרש", value: avgOf(report, ON_FIELD_BEHAVIOR_SKILLS.map(([k]) => k)) },
    { label: "שפת גוף", value: avgOf(report, BODY_LANGUAGE_SKILLS.map(([k]) => k)) },
  ];
}
