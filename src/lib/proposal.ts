// VERA player proposal: pure helpers shared by the proposal page (server) and
// the proposal editor (client). Everything the one-page A4 proposal shows is
// derived here from the CRM record, so the page itself stays presentational.
import { MENTAL_SKILLS, PHYSICAL_SKILLS, guessPositionGroup } from "@/lib/constants";
import { calcAge } from "@/lib/format";

export const PROPOSAL_LANGS = ["he", "en", "sr"] as const;
export type ProposalLang = (typeof PROPOSAL_LANGS)[number];
export type Localized = Partial<Record<ProposalLang, string>>;

export const LANG_NAMES: Record<ProposalLang, string> = { he: "עברית", en: "English", sr: "Srpski" };

// ---------- Fixed deal-term vocabulary ----------
export const TRANSFER_OPTIONS: Record<string, Record<ProposalLang, string>> = {
  free_agent: { he: "שחקן חופשי", en: "Free agent", sr: "Slobodan igrač" },
  free_transfer: { he: "העברה ללא תשלום", en: "Free transfer", sr: "Transfer bez obeštećenja" },
  training_comp: {
    he: "ללא דמי העברה · כפוף לדמי השבחה",
    en: "No transfer fee · subject to training compensation",
    sr: "Bez obeštećenja · uz naknadu za školovanje",
  },
  fee: { he: "העברה בתשלום", en: "Transfer fee", sr: "Transfer uz obeštećenje" },
  fee_training: {
    he: "העברה בתשלום · בתוספת דמי השבחה",
    en: "Transfer fee · plus training compensation",
    sr: "Obeštećenje · plus naknada za školovanje",
  },
  loan: { he: "השאלה", en: "Loan", sr: "Pozajmica" },
  loan_option: { he: "השאלה עם אופציית רכישה", en: "Loan with option to buy", sr: "Pozajmica sa opcijom otkupa" },
};
export const NEGOTIABLE: Record<ProposalLang, string> = { he: "לפי משא ומתן", en: "Negotiable", sr: "Po dogovoru" };

export const PROPOSAL_UI: Record<ProposalLang, Record<string, string>> = {
  he: {
    eyebrow: "הצעת שחקן", prepared: "עבור", facts: "נתוני מפתח", hive: "כוורת תכונות", summary: "סיכום מקצועי",
    why: "למה הוא", links: "וידאו ונתונים", scan: "סרקו לווידאו", contact: "לשאלות נוספות ותיאום",
    conf: "חסוי · מיועד לשימוש המועדון בלבד", photo: "תמונת שחקן", terms: "תנאי עסקה", transfer: "העברה",
    salary: "שכר מבוקש (משוער)", avail: "זמינות", pending: "ממתין לדוח סקאוטינג",
    hiveSource: "הערכת סקאוטינג VERA, סולם 1 עד 10", phone: "טלפון", email: "מייל",
  },
  en: {
    eyebrow: "Player proposal", prepared: "for", facts: "Key facts", hive: "Attribute hive", summary: "Scouting summary",
    why: "Why him", links: "Video and data", scan: "Scan to watch", contact: "Further information",
    conf: "Confidential · prepared for club use", photo: "Player photo", terms: "Deal terms", transfer: "Transfer",
    salary: "Salary expectation (est.)", avail: "Available from", pending: "Scouting report pending",
    hiveSource: "VERA scouting assessment, 1 to 10 scale", phone: "Phone", email: "Email",
  },
  sr: {
    eyebrow: "Predlog igrača", prepared: "za", facts: "Ključni podaci", hive: "Profil kvaliteta", summary: "Skauting rezime",
    why: "Zašto on", links: "Video i podaci", scan: "Skenirajte za video", contact: "Dodatne informacije",
    conf: "Poverljivo · samo za upotrebu kluba", photo: "Fotografija igrača", terms: "Uslovi transfera", transfer: "Transfer",
    salary: "Očekivana plata (procena)", avail: "Dostupan od", pending: "Skauting izveštaj u pripremi",
    hiveSource: "VERA skauting procena, skala 1 do 10", phone: "Telefon", email: "Email",
  },
};

export const DEFAULT_CONTACT = {
  name: "Ariel Samuel",
  title: {
    he: "סוכן שחקנים מורשה FIFA · VERA",
    en: "FIFA Licensed Football Agent · VERA",
    sr: "FIFA licencirani agent · VERA",
  } as Record<ProposalLang, string>,
  phone: "+972 54 397 9451",
  email: "ariel@verafootball.com",
  note: {
    he: "משחקים מלאים, נתוני ביצוע מלאים ופרטים נוספים על השחקן זמינים לפי בקשה.",
    en: "Full matches, complete performance data and further player details are available on request.",
    sr: "Kompletne utakmice, detaljni podaci o učinku i dodatne informacije o igraču dostupni su na zahtev.",
  } as Record<ProposalLang, string>,
};

// ---------- Positions ----------
// Positions are stored as free text (usually Hebrew), so map them to the
// short international codes clubs read at a glance.
export function positionCode(text?: string | null): string | null {
  if (!text) return null;
  const t = text.trim();
  const up = t.toUpperCase();
  const rules: [RegExp, string][] = [
    [/שוער|\bGK\b/, "GK"],
    [/בלם|\bCB\b/, "CB"],
    [/מגן ימ|\bRB\b|\bRWB\b/, "RB"],
    [/מגן שמ|\bLB\b|\bLWB\b/, "LB"],
    [/מגן/, "FB"],
    [/קשר הגנתי|קשר אחורי|\bCDM\b|\bDM\b/, "DM"],
    [/קשר התקפי|\bCAM\b|\bAM\b/, "AM"],
    [/קשר|\bCM\b/, "CM"],
    [/כנף ימ|\bRW\b|\bRM\b/, "RW"],
    [/כנף שמ|\bLW\b|\bLM\b/, "LW"],
    [/כנף|\bW\b/, "W"],
    [/חלוץ שני|\bSS\b/, "SS"],
    [/חלוץ|\bST\b|\bCF\b/, "ST"],
  ];
  for (const [re, code] of rules) if (re.test(t) || re.test(up)) return code;
  return t;
}

function positionCodes(text?: string | null): string[] {
  if (!text) return [];
  return text
    .split(/[,/·;|]+|\s+ו/)
    .map((s) => positionCode(s))
    .filter((s): s is string => !!s);
}

// ---------- Small deterministic translations for common CRM values ----------
const FOOT: Record<string, Record<ProposalLang, string>> = {
  ימין: { he: "ימין", en: "Right", sr: "Desna" },
  שמאל: { he: "שמאל", en: "Left", sr: "Leva" },
  "שתי הרגליים": { he: "שתי הרגליים", en: "Both", sr: "Obe" },
};
const FOOT_CODE: Record<string, string> = { ימין: "R", שמאל: "L", "שתי הרגליים": "Both" };

const COUNTRY: Record<string, Record<ProposalLang, string>> = {
  ישראל: { he: "ישראל", en: "Israel", sr: "Izrael" },
  ישראלי: { he: "ישראל", en: "Israel", sr: "Izrael" },
  ישראלית: { he: "ישראל", en: "Israel", sr: "Izrael" },
  סרביה: { he: "סרביה", en: "Serbia", sr: "Srbija" },
  סרבי: { he: "סרביה", en: "Serbia", sr: "Srbija" },
  נורווגיה: { he: "נורווגיה", en: "Norway", sr: "Norveška" },
  נורווגי: { he: "נורווגיה", en: "Norway", sr: "Norveška" },
  פורטוגל: { he: "פורטוגל", en: "Portugal", sr: "Portugal" },
  פורטוגלי: { he: "פורטוגל", en: "Portugal", sr: "Portugal" },
  צרפת: { he: "צרפת", en: "France", sr: "Francuska" },
  צרפתי: { he: "צרפת", en: "France", sr: "Francuska" },
  גרמניה: { he: "גרמניה", en: "Germany", sr: "Nemačka" },
  גרמני: { he: "גרמניה", en: "Germany", sr: "Nemačka" },
  פולין: { he: "פולין", en: "Poland", sr: "Poljska" },
  פולני: { he: "פולין", en: "Poland", sr: "Poljska" },
  רומניה: { he: "רומניה", en: "Romania", sr: "Rumunija" },
  רומני: { he: "רומניה", en: "Romania", sr: "Rumunija" },
  אוקראינה: { he: "אוקראינה", en: "Ukraine", sr: "Ukrajina" },
  אוקראיני: { he: "אוקראינה", en: "Ukraine", sr: "Ukrajina" },
};
const LEAGUE: Record<string, Record<ProposalLang, string>> = {
  "ליגת העל": { he: "ליגת העל", en: "Ligat ha'Al (ISR 1)", sr: "Ligat ha'Al (ISR 1)" },
  "הליגה הלאומית": { he: "הליגה הלאומית", en: "Liga Leumit (ISR 2)", sr: "Liga Leumit (ISR 2)" },
  לאומית: { he: "הליגה הלאומית", en: "Liga Leumit (ISR 2)", sr: "Liga Leumit (ISR 2)" },
  "ליגה לאומית": { he: "הליגה הלאומית", en: "Liga Leumit (ISR 2)", sr: "Liga Leumit (ISR 2)" },
};

function localizeKnown(map: Record<string, Record<ProposalLang, string>>, value?: string | null): Localized | null {
  if (!value) return null;
  const hit = map[value.trim()];
  return hit ? { ...hit } : { he: value };
}

// ---------- Facts ----------
export type ProposalFact = { id: string; label: Record<ProposalLang, string>; value: Localized };

function fmtDate(iso?: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  return `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}.${d.getFullYear()}`;
}

function fmtMonthYear(iso?: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  return `${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

function heightMeters(h?: number | null): string | null {
  if (!h) return null;
  const m = h > 3 ? h / 100 : h;
  return `${m.toFixed(2)} m`;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function buildProposalBasics(detail: any) {
  const p = detail.player;
  const age = calcAge(p.dateOfBirth);
  const activeContract =
    detail.contracts.find((c: { status: string }) => c.status === "ACTIVE") ?? detail.contracts[0];
  const activeRep = detail.representation.find((r: { status: string }) => r.status === "ACTIVE");
  const mainCode = positionCode(p.mainPosition);
  const also = positionCodes(p.secondaryPositions).filter((c) => c !== mainCode);
  const clubName: string | null = detail.club?.name ?? null;

  const nat = [p.nationality, p.secondNationality].filter(Boolean) as string[];
  const natLocalized: Localized = {};
  for (const lang of PROPOSAL_LANGS) {
    const parts = nat.map((n) => localizeKnown(COUNTRY, n)?.[lang]).filter(Boolean);
    if (parts.length === nat.length && parts.length) natLocalized[lang] = parts.join(" · ");
  }

  const facts: ProposalFact[] = [
    { id: "club", label: { he: "מועדון", en: "Club", sr: "Klub" }, value: clubName ? { he: clubName } : { he: "", en: "Free agent", sr: "Slobodan igrač" } },
    { id: "league", label: { he: "ליגה", en: "League", sr: "Liga" }, value: localizeKnown(LEAGUE, p.currentLeague ?? detail.club?.league) ?? {} },
    { id: "born", label: { he: "תאריך לידה", en: "Born", sr: "Rođen" }, value: fmtDate(p.dateOfBirth) ? { he: `${fmtDate(p.dateOfBirth)}${age !== null ? ` (${age})` : ""}`, en: `${fmtDate(p.dateOfBirth)}${age !== null ? ` (${age})` : ""}`, sr: `${fmtDate(p.dateOfBirth)}${age !== null ? ` (${age})` : ""}` } : {} },
    { id: "height", label: { he: "גובה", en: "Height", sr: "Visina" }, value: heightMeters(p.height) ? { he: heightMeters(p.height)!, en: heightMeters(p.height)!, sr: heightMeters(p.height)! } : {} },
    { id: "foot", label: { he: "רגל", en: "Foot", sr: "Noga" }, value: localizeKnown(FOOT, p.strongFoot) ?? {} },
    { id: "citizenship", label: { he: "אזרחות", en: "Citizenship", sr: "Državljanstvo" }, value: nat.length ? (natLocalized.he ? natLocalized : { he: nat.join(" · ") }) : {} },
    { id: "also", label: { he: "עמדות נוספות", en: "Also plays", sr: "Takođe igra" }, value: also.length ? { he: also.join(" · "), en: also.join(" · "), sr: also.join(" · ") } : {} },
    { id: "contract", label: { he: "חוזה עד", en: "Contract until", sr: "Ugovor do" }, value: fmtDate(activeContract?.endDate) ? { he: fmtDate(activeContract.endDate)!, en: fmtDate(activeContract.endDate)!, sr: fmtDate(activeContract.endDate)! } : {} },
    { id: "country", label: { he: "מדינה", en: "Country", sr: "Država" }, value: localizeKnown(COUNTRY, p.currentCountry ?? detail.club?.country) ?? {} },
    { id: "weight", label: { he: "משקל", en: "Weight", sr: "Težina" }, value: p.weight ? { he: `${p.weight} kg`, en: `${p.weight} kg`, sr: `${p.weight} kg` } : {} },
    { id: "agency", label: { he: "ייצוג", en: "Represented by", sr: "Agencija" }, value: activeRep ? { he: activeRep.exclusive ? "VERA · בלעדי" : "VERA", en: activeRep.exclusive ? "VERA · exclusive" : "VERA", sr: activeRep.exclusive ? "VERA · ekskluzivno" : "VERA" } : {} },
  ];

  const footCode = p.strongFoot ? FOOT_CODE[p.strongFoot] ?? p.strongFoot : null;
  const dataline = [
    mainCode,
    age !== null ? `Age ${age}` : null,
    footCode ? `Foot ${footCode}` : null,
    heightMeters(p.height),
    fmtMonthYear(activeContract?.endDate) ? `Contract ${fmtMonthYear(activeContract.endDate)}` : null,
  ].filter(Boolean) as string[];

  // Country is redundant when it only repeats the citizenship.
  const countryFact = facts.find((f) => f.id === "country");
  const citizenshipFact = facts.find((f) => f.id === "citizenship");
  if (countryFact && citizenshipFact && countryFact.value.he && countryFact.value.he === citizenshipFact.value.he) {
    countryFact.value = {};
  }

  return {
    name: {
      he: p.fullNameHebrew || `${p.firstName} ${p.lastName}`,
      en: p.fullNameEnglish || "",
      sr: p.fullNameEnglish || "",
    } as Localized,
    facts: facts.filter((f) => Object.values(f.value).some((v) => v)),
    dataline,
  };
}

// ---------- Hive ----------
type HiveDef = { key: string; label: Record<ProposalLang, string> };
const L = (he: string, en: string, sr: string) => ({ he, en, sr });

const TECHNICAL_PRIORITY: Record<string, HiveDef[]> = {
  GOALKEEPER: [
    { key: "shotStopping", label: L("עצירות", "Shot-stopping", "Odbrane") },
    { key: "reflexes", label: L("רפלקסים", "Reflexes", "Refleksi") },
    { key: "distribution", label: L("משחק רגל", "Distribution", "Igra nogom") },
    { key: "commandOfArea", label: L("שליטה ברחבה", "Command of area", "Kontrola šesnaesterca") },
    { key: "oneOnOnes", label: L("אחד על אחד", "One-on-ones", "Jedan na jedan") },
    { key: "aerialCommand", label: L("משחק אוויר", "Aerial command", "Igra u vazduhu") },
    { key: "gkCommunication", label: L("תקשורת", "Communication", "Komunikacija") },
  ],
  DEFENDER: [
    { key: "positioning", label: L("מיצוב", "Positioning", "Postavljanje") },
    { key: "tackling", label: L("תיקול", "Tackling", "Startovi") },
    { key: "aerialDuels", label: L("משחק אוויר", "Aerial duels", "Dueli u vazduhu") },
    { key: "buildUpPlay", label: L("יציאה עם כדור", "Build-up", "Izgradnja igre") },
    { key: "oneVOneDefending", label: L("הגנה 1 על 1", "1v1 defending", "Odbrana 1 na 1") },
    { key: "marking", label: L("השגחה", "Marking", "Čuvanje") },
    { key: "recoveryPace", label: L("מהירות חזרה", "Recovery pace", "Brzina povratka") },
  ],
  MIDFIELDER: [
    { key: "vision", label: L("ראיית משחק", "Vision", "Pregled igre") },
    { key: "passingRange", label: L("טווח מסירה", "Passing", "Pas") },
    { key: "ballControl", label: L("שליטה בכדור", "Ball control", "Kontrola lopte") },
    { key: "creativity", label: L("יצירתיות", "Creativity", "Kreativnost") },
    { key: "pressingWork", label: L("עבודת לחץ", "Pressing", "Presing") },
    { key: "midDribbling", label: L("כדרור", "Dribbling", "Dribling") },
    { key: "boxToBox", label: L("שני כיוונים", "Box-to-box", "Box-to-box") },
    { key: "setPieces", label: L("כדורים עצורים", "Set pieces", "Prekidi") },
  ],
  FORWARD: [
    { key: "finishing", label: L("סיום", "Finishing", "Završnica") },
    { key: "movementInBox", label: L("תנועה ברחבה", "Movement", "Kretanje") },
    { key: "fwdDribbling", label: L("כדרור", "Dribbling", "Dribling") },
    { key: "holdUpPlay", label: L("משחק גב", "Hold-up play", "Igra leđima") },
    { key: "pressingFromFront", label: L("לחץ מלמעלה", "Pressing", "Presing") },
    { key: "headingInBox", label: L("משחק ראש", "Heading", "Igra glavom") },
    { key: "composureInBox", label: L("קור רוח", "Composure", "Smirenost") },
    { key: "crossingCutting", label: L("הרמות", "Crossing", "Centaršutevi") },
  ],
};

export type HiveAxis = { key: string; label: Record<ProposalLang, string>; value: number };

function avg(values: unknown[]): number | null {
  const nums = values.filter((v): v is number => typeof v === "number");
  return nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : null;
}

// Six axes: the four best-covered position-specific skills plus physical and
// mental averages. CRM ratings are 0-5 stars; the hive shows them on 1-10.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function buildHive(report: any, mainPosition?: string | null): HiveAxis[] {
  if (!report) return [];
  const group = report.positionGroup ?? guessPositionGroup(mainPosition);
  let technical: Record<string, number> = {};
  try {
    technical = report.technicalRatings ? JSON.parse(report.technicalRatings) : {};
  } catch {
    technical = {};
  }
  const axes: HiveAxis[] = [];
  for (const def of TECHNICAL_PRIORITY[group] ?? []) {
    const v = technical[def.key];
    if (typeof v === "number" && axes.length < 4) axes.push({ ...def, value: Math.round(v * 20) / 10 });
  }
  const physical = avg(PHYSICAL_SKILLS.map(([k]) => report[k]));
  const mental = avg(MENTAL_SKILLS.map(([k]) => report[k]));
  if (physical !== null) axes.push({ key: "physical", label: L("פיזיות", "Physical", "Fizika"), value: Math.round(physical * 20) / 10 });
  if (mental !== null) axes.push({ key: "mental", label: L("מנטליות", "Mental", "Mentalitet"), value: Math.round(mental * 20) / 10 });
  return axes.length >= 3 ? axes : [];
}

// ---------- Links ----------
export type ProposalLink = { id: string; type: string; title: string; url: string; isVideo: boolean; ready: boolean };

const VIDEO_LINK_TYPES = new Set(["YOUTUBE", "HIGHLIGHTS", "FULL_MATCH", "HUDL", "VIMEO", "GOOGLE_DRIVE"]);
const STATS_LINK_TYPES = ["TRANSFERMARKT", "SOFASCORE", "WYSCOUT", "INSTAT"];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function collectLinks(detail: any): { all: ProposalLink[]; defaults: string[] } {
  const all: ProposalLink[] = [
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ...detail.videos.map((v: any) => ({
      id: `v:${v.id}`,
      type: v.type === "FULL_MATCH" ? "Full match" : "Highlights",
      title: v.title,
      url: v.url,
      isVideo: true,
      ready: !!v.readyToSend,
    })),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ...detail.links.map((l: any) => ({
      id: `l:${l.id}`,
      type: l.type === "HIGHLIGHTS" ? "Highlights" : l.type === "FULL_MATCH" ? "Full match" : l.type.charAt(0) + l.type.slice(1).toLowerCase().replace("_", " "),
      title: l.title,
      url: l.url,
      isVideo: VIDEO_LINK_TYPES.has(l.type),
      ready: false,
    })),
  ];
  const defaults: string[] = [];
  const video = all.find((l) => l.isVideo && l.ready) ?? all.find((l) => l.isVideo);
  if (video) defaults.push(video.id);
  for (const t of STATS_LINK_TYPES) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const found = detail.links.find((l: any) => l.type === t);
    if (found && defaults.length < 3) defaults.push(`l:${found.id}`);
  }
  return { all, defaults };
}

// First 2-3 sentences of a longer text, capped to fit the one-page layout.
export function trimSummary(text?: string | null, max = 340): string {
  if (!text) return "";
  const sentences = text.replace(/\s+/g, " ").trim().match(/[^.!?]+[.!?]+/g) ?? [text];
  let out = "";
  for (const s of sentences) {
    if ((out + s).length > max) break;
    out += s;
  }
  return (out || text.slice(0, max)).trim();
}
