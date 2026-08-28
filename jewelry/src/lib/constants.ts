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
