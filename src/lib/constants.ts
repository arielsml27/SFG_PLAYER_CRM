export const PLAYER_STATUSES = [
  "PROSPECT",
  "SIGNED",
  "ACTIVE_CLIENT",
  "NEGOTIATION",
  "TRIAL",
  "LOAN",
  "FREE_AGENT",
  "MONITORING",
  "CLOSED",
  "LOST",
] as const;

export const PLAYER_STATUS_LABELS: Record<string, string> = {
  PROSPECT: "פרוספקט",
  SIGNED: "חתום",
  ACTIVE_CLIENT: "לקוח פעיל",
  NEGOTIATION: "במו״מ",
  TRIAL: "נסיון",
  LOAN: "השאלה",
  FREE_AGENT: "סוכן חופשי",
  MONITORING: "במעקב",
  CLOSED: "סגור",
  LOST: "אבוד",
};

export const CONTRACT_STATUSES = ["ACTIVE", "ENDED", "IN_NEGOTIATION", "UNKNOWN"] as const;
export const CONTRACT_STATUS_LABELS: Record<string, string> = {
  ACTIVE: "פעיל",
  ENDED: "נגמר",
  IN_NEGOTIATION: "במו״מ",
  UNKNOWN: "לא ידוע",
};

export const REPRESENTATION_STATUSES = ["ACTIVE", "ENDED", "IN_NEGOTIATION", "UNKNOWN"] as const;
export const REPRESENTATION_STATUS_LABELS: Record<string, string> = {
  ACTIVE: "פעיל",
  ENDED: "נגמר",
  IN_NEGOTIATION: "במו״מ",
  UNKNOWN: "לא ידוע",
};

export const LINK_TYPES = [
  "TRANSFERMARKT",
  "SOFASCORE",
  "WYSCOUT",
  "INSTAT",
  "YOUTUBE",
  "HUDL",
  "VIMEO",
  "INSTAGRAM",
  "ARTICLE",
  "FULL_MATCH",
  "HIGHLIGHTS",
  "GOOGLE_DRIVE",
  "DOCUMENT",
  "OTHER",
] as const;

export const LINK_TYPE_LABELS: Record<string, string> = {
  TRANSFERMARKT: "Transfermarkt",
  SOFASCORE: "SofaScore",
  WYSCOUT: "Wyscout",
  INSTAT: "Instat",
  YOUTUBE: "YouTube",
  HUDL: "Hudl",
  VIMEO: "Vimeo",
  INSTAGRAM: "Instagram",
  ARTICLE: "כתבה",
  FULL_MATCH: "משחק מלא",
  HIGHLIGHTS: "היילייטס",
  GOOGLE_DRIVE: "Google Drive",
  DOCUMENT: "מסמך",
  OTHER: "אחר",
};

export const VIDEO_TYPES = ["HIGHLIGHTS", "FULL_MATCH", "TRAINING", "SCOUTING", "MEDIA"] as const;
export const VIDEO_TYPE_LABELS: Record<string, string> = {
  HIGHLIGHTS: "היילייטס",
  FULL_MATCH: "משחק מלא",
  TRAINING: "אימון",
  SCOUTING: "סקאוטינג",
  MEDIA: "מדיה",
};

export const DOCUMENT_TYPES = [
  "CLUB_CONTRACT",
  "REPRESENTATION_AGREEMENT",
  "ID_PASSPORT",
  "PARENTAL_CONSENT",
  "FEDERATION_FORM",
  "MEDICAL",
  "CLUB_OFFER",
  "LEGAL_LETTER",
  "OTHER",
] as const;
export const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  CLUB_CONTRACT: "חוזה מועדון",
  REPRESENTATION_AGREEMENT: "הסכם ייצוג",
  ID_PASSPORT: "ת.ז / דרכון",
  PARENTAL_CONSENT: "אישור הורים",
  FEDERATION_FORM: "טופס FIFA / התאחדות",
  MEDICAL: "מסמך רפואי",
  CLUB_OFFER: "הצעה ממועדון",
  LEGAL_LETTER: "מכתב משפטי",
  OTHER: "אחר",
};

export const CONTACT_ROLES = [
  "FATHER",
  "MOTHER",
  "LAWYER",
  "COACH",
  "SPORTING_DIRECTOR",
  "TEAM_MANAGER",
  "CLUB_REPRESENTATIVE",
  "FINANCE",
  "OTHER",
] as const;
export const CONTACT_ROLE_LABELS: Record<string, string> = {
  FATHER: "אבא",
  MOTHER: "אמא",
  LAWYER: "עורך דין",
  COACH: "מאמן",
  SPORTING_DIRECTOR: "מנהל מקצועי",
  TEAM_MANAGER: "מנהל קבוצה",
  CLUB_REPRESENTATIVE: "נציג מועדון",
  FINANCE: "איש כספים",
  OTHER: "אחר",
};

export const PROSPECT_STATUSES = ["NOT_CONTACTED", "CONTACTED_NO_MEETING", "MEETING_SCHEDULED", "MEETING_HELD"] as const;
export const PROSPECT_STATUS_LABELS: Record<string, string> = {
  NOT_CONTACTED: "לא נעשתה פניה",
  CONTACTED_NO_MEETING: "נעשתה פניה ולא נקבעה פגישה",
  MEETING_SCHEDULED: "נקבעה פגישה",
  MEETING_HELD: "הייתה פגישה",
};

export const TIMELINE_EVENT_TYPES = [
  "FAMILY_CALL",
  "CLUB_CALL",
  "OFFER_RECEIVED",
  "CONTRACT_DRAFT",
  "IMPORTANT_MATCH",
  "INJURY",
  "STATUS_CHANGE",
  "VIDEO_SENT",
  "MEETING",
  "NEGOTIATION",
  "INTERNAL_NOTE",
] as const;
export const TIMELINE_EVENT_TYPE_LABELS: Record<string, string> = {
  FAMILY_CALL: "שיחה עם משפחה",
  CLUB_CALL: "שיחה עם מועדון",
  OFFER_RECEIVED: "הצעה שהתקבלה",
  CONTRACT_DRAFT: "טיוטת חוזה",
  IMPORTANT_MATCH: "משחק חשוב",
  INJURY: "פציעה",
  STATUS_CHANGE: "שינוי סטטוס",
  VIDEO_SENT: "שליחת וידאו",
  MEETING: "פגישה",
  NEGOTIATION: "מו״מ",
  INTERNAL_NOTE: "הערה פנימית",
  SUBSCRIPTION: "שדרוג מנוי",
  QUESTIONNAIRE: "שאלון מורחב",
};

export const TASK_PRIORITIES = ["LOW", "NORMAL", "HIGH", "CRITICAL"] as const;
export const TASK_PRIORITY_LABELS: Record<string, string> = {
  LOW: "נמוכה",
  NORMAL: "רגילה",
  HIGH: "גבוהה",
  CRITICAL: "קריטית",
};

export const TASK_STATUSES = ["OPEN", "IN_PROGRESS", "DONE", "CANCELLED"] as const;
export const TASK_STATUS_LABELS: Record<string, string> = {
  OPEN: "פתוח",
  IN_PROGRESS: "בטיפול",
  DONE: "בוצע",
  CANCELLED: "בוטל",
};

export const TARGET_LEVELS = ["ISRAEL", "SERBIA", "EUROPE", "USA", "ACADEMY", "SENIOR"] as const;
export const TARGET_LEVEL_LABELS: Record<string, string> = {
  ISRAEL: "ישראל",
  SERBIA: "סרביה",
  EUROPE: "אירופה",
  USA: "ארה״ב",
  ACADEMY: "אקדמיה",
  SENIOR: "בוגרים",
};

export const YES_NO_NA = ["YES", "NO", "NA"] as const;
export const YES_NO_NA_LABELS: Record<string, string> = {
  YES: "כן",
  NO: "לא",
  NA: "לא רלוונטי",
};

export const RELOCATE_OPTIONS = ["YES", "NO", "MAYBE"] as const;
export const RELOCATE_LABELS: Record<string, string> = {
  YES: "כן",
  NO: "לא",
  MAYBE: "אולי",
};

export const DEAL_TYPES = ["TRANSFER", "LOAN", "CONTRACT_RENEWAL", "REPRESENTATION", "OTHER"] as const;
export const DEAL_TYPE_LABELS: Record<string, string> = {
  TRANSFER: "מעבר",
  LOAN: "השאלה",
  CONTRACT_RENEWAL: "חידוש חוזה",
  REPRESENTATION: "ייצוג",
  OTHER: "אחר",
};

export const DEAL_STATUSES = ["OPEN", "IN_NEGOTIATION", "WON", "LOST", "CANCELLED"] as const;
export const DEAL_STATUS_LABELS: Record<string, string> = {
  OPEN: "פתוח",
  IN_NEGOTIATION: "במו״מ",
  WON: "נסגר בהצלחה",
  LOST: "נכשל",
  CANCELLED: "בוטל",
};

export const STRONG_FOOT_OPTIONS = ["ימין", "שמאל", "שתי הרגליים"];

export const POSITION_GROUPS = ["GOALKEEPER", "DEFENDER", "MIDFIELDER", "FORWARD"] as const;
export const POSITION_GROUP_LABELS: Record<string, string> = {
  GOALKEEPER: "שוער",
  DEFENDER: "מגן",
  MIDFIELDER: "קשר",
  FORWARD: "חלוץ / כנף",
};

export function guessPositionGroup(mainPosition?: string | null): (typeof POSITION_GROUPS)[number] {
  const p = (mainPosition ?? "").toUpperCase();
  if (/\bGK\b|שוער/.test(p)) return "GOALKEEPER";
  if (/\bCB\b|\bRB\b|\bLB\b|\bWB\b|מגן|בלם/.test(p)) return "DEFENDER";
  if (/\bCM\b|\bCDM\b|\bCAM\b|\bDM\b|\bAM\b|קשר/.test(p)) return "MIDFIELDER";
  return "FORWARD";
}

export const TECHNICAL_SKILLS_BY_POSITION: Record<string, [string, string][]> = {
  GOALKEEPER: [
    ["shotStopping", "עצירת בעיטות"],
    ["distribution", "משחק רגליים / בניית משחק"],
    ["commandOfArea", "שליטה בתחום העונשין"],
    ["oneOnOnes", "יציאות אחד על אחד"],
    ["aerialCommand", "שליטה במשחק אוויר"],
    ["reflexes", "רפלקסים"],
    ["gkCommunication", "תקשורת עם ההגנה"],
  ],
  DEFENDER: [
    ["tackling", "טאקל"],
    ["marking", "מארקינג / השגחה"],
    ["aerialDuels", "קרבות אוויר"],
    ["positioning", "מיצוב הגנתי"],
    ["buildUpPlay", "בניית משחק מאחור"],
    ["recoveryPace", "מהירות התאוששות"],
    ["oneVOneDefending", "הגנה אחד על אחד"],
  ],
  MIDFIELDER: [
    ["passingRange", "טווח מסירות"],
    ["vision", "ראיית משחק"],
    ["pressingWork", "עבודת לחץ"],
    ["ballControl", "שליטה בכדור"],
    ["boxToBox", "עבודה בשני הכיוונים"],
    ["midDribbling", "כדרור"],
    ["setPieces", "כדורים עצורים"],
    ["creativity", "יצירתיות"],
  ],
  FORWARD: [
    ["finishing", "סיום"],
    ["movementInBox", "תזמון תנועה ברחבה"],
    ["fwdDribbling", "כדרור"],
    ["holdUpPlay", "משחק גב לשער"],
    ["crossingCutting", "הרמות / חיתוכים פנימה"],
    ["headingInBox", "משחק ראש ברחבה"],
    ["composureInBox", "קור רוח מול השער"],
    ["pressingFromFront", "לחץ מלמעלה"],
  ],
};

export const ON_FIELD_BEHAVIOR_SKILLS: [string, string][] = [
  ["workRateOffBall", "תדירות ריצות מהירות ותנועה ללא כדור"],
  ["tacklingPressDefense", "תיקולים, לחץ על היריב, חזרה להגנה"],
  ["dribblingShootingCreating", "ניסיונות כדרור, בעיטות, יצירת מצבים"],
  ["passingRangeUnderPressure", "מסירות קצרות, מסירות ארוכות, השתחררות מלחץ"],
  ["firstTouchTightSpace", "נגיעה ראשונה, שמירה על כדור בשטח קטן"],
  ["spaceAwareness", "מודעות למרחב, תנועה חכמה לשטח ללא כדור"],
  ["teamCommunication", "שיתוף פעולה, תקשורת עם חברי הקבוצה"],
  ["selfControlAfterFoul", "שליטה עצמית לאחר עבירה שבוצעה נגדו"],
  ["gameReadingAnticipation", "צפיית מהלכים, הבנת היריב"],
];

export const BODY_LANGUAGE_SKILLS: [string, string][] = [
  ["postureConfidence", "עמידה ובטחון"],
  ["reactionToTeamLoss", "תגובות לאיבוד של הקבוצה"],
  ["reactionToOwnLoss", "תגובות לאיבוד שלו"],
  ["concentrationWhenUninvolved", "ריכוז כשלא מעורב, התנהגות מחוץ למגרש"],
  ["composureUnderPressure", "קור רוח"],
  ["teamOrganisationEncouragement", "ארגון הקבוצה ועידוד"],
  ["endGameEffort", "מאמץ בסוף המשחק, סימני עייפות"],
  ["respectForReferee", "כבוד לשופט"],
  ["attitudeDuringSubstitution", "גישה בעת חילוף"],
  ["coachBenchInteraction", "שיח כללי עם מאמן ותגובות לספסל"],
  ["recoveryFromTackles", "התאוששות מתקלים וקשיחות"],
];

export const OVERALL_RATING_SKILLS: [string, string][] = [
  ["generalTechnicalAbility", "יכולת טכנית כללית"],
  ["mentalResilience", "חוסן מנטלי"],
  ["overallPotential", "פוטנציאל כללי"],
];

export const FAMILY_SKILLS: [string, string][] = [
  ["familyCooperation", "שיתוף פעולה עם הסוכנות"],
  ["familyInvolvementBalance", "מעורבות מאוזנת (לא חודרנית)"],
  ["familyExpectations", "ציפיות ריאליות"],
  ["familyStability", "יציבות ותמיכה"],
  ["familyProfessionalism", "מקצועיות בתקשורת"],
  ["familyPositiveEncouragement", "עידוד חיובי לעומת ביקורת קולנית"],
  ["familyWatchingCalmly", "צופים בשקט או מגיבים בעצבנות למשחק"],
  ["familyCommentsShoutingAtOthers", "מעירים וצועקים לאחרים"],
  ["familyArguingWithOtherParents", "מתווכחים עם הורים אחרים"],
];

export const PHYSICAL_SKILLS: [string, string][] = [
  ["speed", "מהירות"],
  ["pace", "קצב"],
  ["stamina", "סיבולת"],
  ["explosiveness", "נפיצות"],
  ["supportPlay", "משחק תמיכה"],
  ["crossing", "הרמות"],
  ["strength", "כוח"],
  ["durability", "עמידות מפני פציעות"],
];

export const MENTAL_SKILLS: [string, string][] = [
  ["concentration", "ריכוז"],
  ["attitude", "גישה"],
  ["motivation", "מוטיבציה"],
  ["workRate", "יכולת עבודה"],
  ["leadership", "מנהיגות"],
  ["composure", "קור רוח"],
];

// English labels for the same attribute keys, used by the (English) player
// export report. Family-assessment keys are omitted on purpose: that group
// scores the parents, not the player, and never appears in external reports.
export const ATTRIBUTE_LABELS_EN: Record<string, string> = {
  // Technical — Goalkeeper
  shotStopping: "Shot Stopping",
  distribution: "Distribution / Footwork",
  commandOfArea: "Command of Area",
  oneOnOnes: "One-on-One Situations",
  aerialCommand: "Aerial Command",
  reflexes: "Reflexes",
  gkCommunication: "Communication with Defense",
  // Technical — Defender
  tackling: "Tackling",
  marking: "Marking",
  aerialDuels: "Aerial Duels",
  positioning: "Defensive Positioning",
  buildUpPlay: "Build-Up Play",
  recoveryPace: "Recovery Pace",
  oneVOneDefending: "1v1 Defending",
  // Technical — Midfielder
  passingRange: "Passing Range",
  vision: "Vision",
  pressingWork: "Pressing Work Rate",
  ballControl: "Ball Control",
  boxToBox: "Box-to-Box Play",
  midDribbling: "Dribbling",
  setPieces: "Set Pieces",
  creativity: "Creativity",
  // Technical — Forward
  finishing: "Finishing",
  movementInBox: "Movement in the Box",
  fwdDribbling: "Dribbling",
  holdUpPlay: "Hold-Up Play",
  crossingCutting: "Crossing / Cutting Inside",
  headingInBox: "Heading in the Box",
  composureInBox: "Composure in Front of Goal",
  pressingFromFront: "Pressing from the Front",
  // On-field behavior
  workRateOffBall: "Off-the-Ball Work Rate",
  tacklingPressDefense: "Tackling, Pressing, Defensive Recovery",
  dribblingShootingCreating: "Dribbling, Shooting, Creating Chances",
  passingRangeUnderPressure: "Passing Under Pressure",
  firstTouchTightSpace: "First Touch in Tight Spaces",
  spaceAwareness: "Space Awareness / Off-Ball Movement",
  teamCommunication: "Team Communication",
  selfControlAfterFoul: "Self-Control After Being Fouled",
  gameReadingAnticipation: "Game Reading / Anticipation",
  // Body language
  postureConfidence: "Posture & Confidence",
  reactionToTeamLoss: "Reaction to Team Losing Ball",
  reactionToOwnLoss: "Reaction to Own Mistakes",
  concentrationWhenUninvolved: "Concentration When Not Involved",
  composureUnderPressure: "Composure Under Pressure",
  teamOrganisationEncouragement: "Team Organisation & Encouragement",
  endGameEffort: "End-of-Game Effort",
  respectForReferee: "Respect for the Referee",
  attitudeDuringSubstitution: "Attitude During Substitution",
  coachBenchInteraction: "Interaction with Coach/Bench",
  recoveryFromTackles: "Recovery from Tackles / Toughness",
  // Overall rating
  generalTechnicalAbility: "Overall Technical Ability",
  mentalResilience: "Mental Resilience",
  overallPotential: "Overall Potential",
  // Physical
  speed: "Speed",
  pace: "Pace",
  stamina: "Stamina",
  explosiveness: "Explosiveness",
  supportPlay: "Support Play",
  crossing: "Crossing",
  strength: "Strength",
  durability: "Durability / Injury Resistance",
  // Mental
  concentration: "Concentration",
  attitude: "Attitude",
  motivation: "Motivation",
  workRate: "Work Rate",
  leadership: "Leadership",
  composure: "Composure",
};

export const CATEGORY_LABELS_EN: Record<string, string> = {
  "טכני-טקטי": "Technical / Tactical",
  פיזי: "Physical",
  מנטלי: "Mental",
  "התנהגות במגרש": "On-Field Behavior",
  "שפת גוף": "Body Language",
  "הערכה כללית": "Overall Rating",
};
