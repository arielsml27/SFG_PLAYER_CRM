// Public "player request" form (/request/[token]): the fixed vocabulary a coach
// or sporting director picks from, in Hebrew and English, plus the mapping of
// a submission onto a club_requests row. Pure helpers, shared by the public
// page (client) and the submit action (server).

export const REQUEST_FORM_LANGS = ["he", "en"] as const;
export type RequestFormLang = (typeof REQUEST_FORM_LANGS)[number];
type L = Record<RequestFormLang, string>;

export const REQUEST_POSITIONS: { id: string; label: L }[] = [
  { id: "GK", label: { he: "שוער", en: "Goalkeeper" } },
  { id: "CB", label: { he: "בלם", en: "Centre-back" } },
  { id: "RB", label: { he: "מגן ימין", en: "Right-back" } },
  { id: "LB", label: { he: "מגן שמאל", en: "Left-back" } },
  { id: "DM", label: { he: "קשר אחורי", en: "Defensive midfielder" } },
  { id: "CM", label: { he: "קשר מרכזי", en: "Central midfielder" } },
  { id: "AM", label: { he: "קשר התקפי", en: "Attacking midfielder" } },
  { id: "W", label: { he: "כנף", en: "Winger" } },
  { id: "ST", label: { he: "חלוץ", en: "Striker" } },
];

export const REQUEST_WINDOWS: { id: string; label: L }[] = [
  { id: "january", label: { he: "ינואר", en: "January" } },
  { id: "summer", label: { he: "קיץ", en: "Summer" } },
  { id: "both", label: { he: "שניהם", en: "Both" } },
];

export const REQUEST_DEAL_TYPES: { id: string; label: L }[] = [
  { id: "free_agent", label: { he: "שחקן חופשי", en: "Free agent" } },
  { id: "loan", label: { he: "השאלה", en: "Loan" } },
  { id: "fee", label: { he: "העברה בתשלום", en: "Paid transfer" } },
  { id: "any", label: { he: "לא משנה", en: "Any" } },
];

export const REQUEST_AGES: { id: string; label: L }[] = [
  { id: "u23", label: { he: "עד 23", en: "Up to 23" } },
  { id: "23_28", label: { he: "23 עד 28", en: "23 to 28" } },
  { id: "any", label: { he: "לא משנה", en: "Any" } },
];

export const REQUEST_FORM_UI: Record<RequestFormLang, Record<string, string>> = {
  he: {
    eyebrow: "בקשת שחקן",
    title: "איזה שחקן אתם מחפשים?",
    lede: "20 שניות. ככל שתדייקו, השמות שנשלח יהיו רלוונטיים יותר.",
    position: "עמדה",
    positionHint: "אפשר לבחור יותר מאחת",
    window: "חלון",
    dealType: "סוג עסקה",
    age: "גיל",
    priority: "מה הכי חשוב לך בשחקן הזה",
    priorityPh: "למשל: מהירות, ראש משחק, ניסיון בליגה",
    details: "פרטים",
    club: "מועדון",
    name: "שם",
    role: "תפקיד",
    rolePh: "מאמן / מנהל מקצועי",
    phone: "טלפון",
    privacy: "השאלון פנימי של VERA בלבד. המידע לא מועבר לאף גורם אחר ומשמש אותנו רק כדי לדייק את ההצעות שנשלח לך.",
    submit: "שלח",
    sending: "שולח…",
    thanksTitle: "קיבלנו.",
    thanks: "נחזור אליך עם שמות רלוונטיים בלבד.",
    needPosition: "בחרו לפחות עמדה אחת",
    needName: "חסר שם",
    needClub: "חסר שם מועדון",
    needPhone: "חסר טלפון",
    failed: "השליחה נכשלה. נסו שוב בעוד רגע.",
    inactive: "הלינק הזה כבר לא פעיל.",
    agentTitle: "סוכן שחקנים מורשה FIFA · VERA",
  },
  en: {
    eyebrow: "Player request",
    title: "What player are you looking for?",
    lede: "20 seconds. The more precise you are, the more relevant the names we send.",
    position: "Position",
    positionHint: "Pick as many as you need",
    window: "Window",
    dealType: "Deal type",
    age: "Age",
    priority: "What matters most to you in this player",
    priorityPh: "e.g. pace, game intelligence, league experience",
    details: "Details",
    club: "Club",
    name: "Name",
    role: "Role",
    rolePh: "Head coach / Sporting director",
    phone: "Phone",
    privacy: "This form is internal to VERA. The information is not shared with anyone else and is used only to sharpen the proposals we send you.",
    submit: "Send",
    sending: "Sending…",
    thanksTitle: "Got it.",
    thanks: "We will come back to you with relevant names only.",
    needPosition: "Pick at least one position",
    needName: "Name is missing",
    needClub: "Club name is missing",
    needPhone: "Phone is missing",
    failed: "Sending failed. Please try again in a moment.",
    inactive: "This link is no longer active.",
    agentTitle: "FIFA Licensed Football Agent · VERA",
  },
};

export type PublicRequestInput = {
  positions: string[];
  window: string;
  dealType: string;
  age: string;
  priority: string;
  clubName: string;
  name: string;
  role: string;
  phone: string;
  lang: RequestFormLang;
};

function labelOf(list: { id: string; label: L }[], id: string, lang: RequestFormLang = "he"): string | null {
  return list.find((x) => x.id === id)?.label[lang] ?? null;
}

// Validates the raw submission. Returns the cleaned input or the UI key of the
// first problem, so the client can show it in the viewer's language.
export function cleanPublicRequest(
  raw: Partial<PublicRequestInput>,
  opts: { clubLocked: boolean; contactLocked: boolean }
): { ok: true; value: PublicRequestInput } | { ok: false; error: string } {
  const positions = Array.isArray(raw.positions)
    ? raw.positions.filter((p): p is string => typeof p === "string" && REQUEST_POSITIONS.some((x) => x.id === p))
    : [];
  if (positions.length === 0) return { ok: false, error: "needPosition" };

  const pick = (list: { id: string }[], v: unknown, fallback: string) =>
    typeof v === "string" && list.some((x) => x.id === v) ? v : fallback;
  const str = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

  const value: PublicRequestInput = {
    positions: Array.from(new Set(positions)),
    window: pick(REQUEST_WINDOWS, raw.window, "both"),
    dealType: pick(REQUEST_DEAL_TYPES, raw.dealType, "any"),
    age: pick(REQUEST_AGES, raw.age, "any"),
    priority: str(raw.priority, 200),
    clubName: str(raw.clubName, 120),
    name: str(raw.name, 120),
    role: str(raw.role, 80),
    phone: str(raw.phone, 40),
    lang: raw.lang === "en" ? "en" : "he",
  };

  if (!opts.contactLocked) {
    if (!value.name) return { ok: false, error: "needName" };
    if (!value.phone) return { ok: false, error: "needPhone" };
  }
  if (!opts.clubLocked && !value.clubName) return { ok: false, error: "needClub" };
  return { ok: true, value };
}

// The club_requests row has a position field and free-text notes; everything
// the form adds beyond the position goes into the notes in a fixed Hebrew
// layout so it reads well on the request card.
export function buildRequestRow(input: PublicRequestInput, meta: { clubName: string | null }) {
  const positionSought = input.positions.map((p) => labelOf(REQUEST_POSITIONS, p) ?? p).join(", ");
  const lines = [
    `חלון: ${labelOf(REQUEST_WINDOWS, input.window) ?? input.window}`,
    `סוג עסקה: ${labelOf(REQUEST_DEAL_TYPES, input.dealType) ?? input.dealType}`,
    `גיל: ${labelOf(REQUEST_AGES, input.age) ?? input.age}`,
  ];
  if (input.priority) lines.push(`הכי חשוב: ${input.priority}`);
  lines.push("");
  const who = [input.name, input.role].filter(Boolean).join(", ");
  lines.push(`ממלא הטופס: ${who || "לא צוין"}`);
  if (input.phone) lines.push(`טלפון: ${input.phone}`);
  if (!meta.clubName && input.clubName) lines.push(`מועדון: ${input.clubName}`);
  if (input.lang === "en") lines.push("מולא באנגלית");
  return {
    positionSought,
    notes: lines.join("\n"),
    source: `טופס: ${input.name || "ללא שם"}`,
  };
}
