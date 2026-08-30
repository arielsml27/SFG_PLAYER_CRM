/** כל האנומים של המערכת, בעברית. מקור אמת יחיד לכל תפריט ובאדג'. */

export const ORDER_STATUSES = [
  "פנייה",
  "הצעת מחיר",
  "אושר + מקדמה",
  "עיצוב",
  "אישור עיצוב",
  "ייצור במפעל",
  "שיבוץ",
  "גימור וציפוי",
  "בקרת איכות",
  "מוכן",
  "נמסר",
  "תשלום סופי",
  "סגור",
] as const;

/** מצבים שאינם חלק מהמסלול הליניארי. */
export const ORDER_SIDE_STATUSES = [
  "בהמתנה ללקוח",
  "בהמתנה לחומר",
  "בתיקון",
  "הוחזר",
  "בוטל",
] as const;

export const ALL_ORDER_STATUSES = [...ORDER_STATUSES, ...ORDER_SIDE_STATUSES];

/** שלבים שדורשים אישור לפני שממשיכים. */
export const GATE_STATUSES = new Set<string>([
  "אושר + מקדמה",
  "אישור עיצוב",
  "בקרת איכות",
  "תשלום סופי",
]);

export const CLOSED_STATUSES = new Set<string>(["סגור", "בוטל"]);

export const ORDER_TYPES = ["בהזמנה", "ממלאי", "תיקון", "שינוי מידה"] as const;

export const ORDER_CHANNELS = [
  "וואטסאפ",
  "אינסטגרם",
  "המלצה",
  "אתר",
  "פנים אל פנים",
  "תערוכה",
] as const;

export const PRIORITIES = ["רגיל", "דחוף", "קריטי"] as const;

export const CUSTOMER_TYPES = ["פרטי", "חנות", "מפיץ"] as const;

export const CUSTOMER_SOURCES = [
  "אינסטגרם",
  "וואטסאפ",
  "המלצה",
  "אתר",
  "תערוכה",
  "לקוח חוזר",
  "אחר",
] as const;

export const CUSTOMER_STATUSES = ["פעיל", "לא פעיל"] as const;

export const ITEM_CATEGORIES = [
  "טבעת",
  "טבעת אירוסין",
  "שרשרת",
  "תליון",
  "צמיד",
  "עגילים",
  "חפתים",
  "אחר",
] as const;

export const METAL_COLORS = ["צהוב", "לבן", "אדום", "דו-גוני"] as const;

export const STONE_TYPES = [
  "יהלום טבעי",
  "יהלום מעבדה",
  "מוסונייט",
  "ספיר",
  "אמרלד",
  "רובי",
  "זירקון",
  "אחר",
] as const;

export const TASK_STATUSES = ["פתוח", "הושלם"] as const;

export const TIMELINE_KINDS = ["הערה", "שיחה", "וואטסאפ", "פגישה", "מייל", "מערכת"] as const;

/** לאיזה באדג' משתייך כל סטטוס. */
export function statusTone(status: string): "accent" | "good" | "warn" | "danger" | "quiet" {
  if (status === "סגור") return "quiet";
  if (status === "בוטל" || status === "הוחזר") return "danger";
  if (status === "נמסר" || status === "תשלום סופי" || status === "מוכן") return "good";
  if (status.startsWith("בהמתנה") || status === "בתיקון") return "warn";
  return "accent";
}

export const PAYMENT_KINDS = ["מקדמה", "ביניים", "סופי", "החזר"] as const;

export const PAYMENT_METHODS = [
  "העברה",
  "אשראי",
  "מזומן",
  "ביט",
  "פייפאל",
  "צ׳ק",
  "אחר",
] as const;

export const CURRENCIES = ["ILS", "USD"] as const;

export const SUPPLIER_TYPES = [
  "מפעל ייצור",
  "משבץ",
  "מצפה",
  "ספק זהב",
  "ספק אבנים",
  "חורט",
  "שליחויות",
  "אחר",
] as const;

/** מסלול הזמנת העבודה מול המפעל. */
export const WORK_ORDER_STATUSES = [
  "נשלח",
  "התקבל במפעל",
  "בעבודה",
  "מוכן",
  "נשלח חזרה",
  "התקבל אצלי",
] as const;

export const WORK_ORDER_SIDE_STATUSES = ["בהמתנה", "נדחה"] as const;

export const ALL_WORK_ORDER_STATUSES = [
  ...WORK_ORDER_STATUSES,
  ...WORK_ORDER_SIDE_STATUSES,
];

/** מה שהמפעל יכול לבחור בעצמו — בלי "התקבל אצלי", שזה אני. */
export const FACTORY_SELECTABLE_STATUSES = [
  "התקבל במפעל",
  "בעבודה",
  "מוכן",
  "נשלח חזרה",
  "בהמתנה",
] as const;

export const WORK_ORDER_CLOSED = new Set<string>(["התקבל אצלי", "נדחה"]);

export const WORK_ORDER_SCOPES = [
  "ייצור מלא",
  "יציקה",
  "שיבוץ",
  "ליטוש וגימור",
  "ציפוי רודיום",
  "תיקון",
  "שינוי מידה",
  "חריטה",
] as const;

export function workOrderTone(status: string): "accent" | "good" | "warn" | "danger" | "quiet" {
  if (status === "נדחה") return "danger";
  if (status === "התקבל אצלי") return "quiet";
  if (status === "מוכן" || status === "נשלח חזרה") return "good";
  if (status === "בהמתנה") return "warn";
  return "accent";
}

export const EXPENSE_CATEGORIES = [
  "שכירות",
  "פרסום ושיווק",
  "אריזה",
  "משלוחים",
  "כלים וציוד",
  "תוכנות ומנויים",
  "רואה חשבון ומשפטי",
  "ביטוח",
  "נסיעות",
  "תערוכות",
  "עמלות סליקה",
  "אחר",
] as const;
