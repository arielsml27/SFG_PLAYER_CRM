import {
  PHYSICAL_SKILLS,
  MENTAL_SKILLS,
  ON_FIELD_BEHAVIOR_SKILLS,
  BODY_LANGUAGE_SKILLS,
  OVERALL_RATING_SKILLS,
  TECHNICAL_SKILLS_BY_POSITION,
} from "@/lib/constants";

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

export type AttributeItem = { key: string; label: string; value: number; category: string };

// Every individual rated attribute across the scouting report (excluding the
// family-assessment group, which scores the parents rather than the player),
// used for the full attribute breakdown chart and the strengths/improvements
// summary. Position-specific technical skills come from technicalRatings
// (a JSON map) since the parameter set depends on the player's position group.
export function buildAllAttributesData(report: any, positionGroup: string): AttributeItem[] {
  const technicalRatings: Record<string, number> = report?.technicalRatings ? JSON.parse(report.technicalRatings) : {};
  const technicalSkills = TECHNICAL_SKILLS_BY_POSITION[positionGroup] ?? [];

  const groups: [string, [string, string][], Record<string, unknown> | null][] = [
    ["טכני-טקטי", technicalSkills, technicalRatings],
    ["פיזי", PHYSICAL_SKILLS, report],
    ["מנטלי", MENTAL_SKILLS, report],
    ["התנהגות במגרש", ON_FIELD_BEHAVIOR_SKILLS, report],
    ["שפת גוף", BODY_LANGUAGE_SKILLS, report],
    ["הערכה כללית", OVERALL_RATING_SKILLS, report],
  ];

  const items: AttributeItem[] = [];
  for (const [category, skills, source] of groups) {
    for (const [key, label] of skills) {
      const value = source?.[key];
      if (typeof value === "number") items.push({ key, label, value, category });
    }
  }
  return items;
}

// Picks the highest and lowest rated attributes as a quick-read summary of
// what the player does well vs. what to work on. Falls back to a plain
// top/bottom split when nothing clears the 4/3 thresholds (e.g. a report
// where every rating sits in the 3-4 middle range).
export function summarizePlayerScouting(items: AttributeItem[]): {
  strengths: AttributeItem[];
  improvements: AttributeItem[];
} {
  if (items.length === 0) return { strengths: [], improvements: [] };

  const sorted = [...items].sort((a, b) => b.value - a.value);
  let strengths = sorted.filter((i) => i.value >= 4).slice(0, 5);
  let improvements = [...sorted].reverse().filter((i) => i.value <= 3).slice(0, 5);

  if (strengths.length === 0 && improvements.length === 0) {
    const half = Math.min(3, Math.ceil(sorted.length / 2));
    strengths = sorted.slice(0, half);
    improvements = sorted.slice(-half).reverse();
  }

  return { strengths, improvements };
}
