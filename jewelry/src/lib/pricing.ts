/**
 * מנוע התמחור — הלוגיקה של מחשבון "מאזני תמחור", מילה במילה.
 *
 * העלות נולדת בדולר (זהב ואבנים מתומחרים בדולר), וההמרה לשקל היא
 * שכבת תצוגה בלבד. כל הזמנה שומרת צילום של השערים ביום שלה.
 */

export const GRAMS_PER_TROY_OZ = 31.1034768;

export const KARATS = [
  { label: "24K", fine: 999 },
  { label: "22K", fine: 916 },
  { label: "21K", fine: 875 },
  { label: "18K", fine: 750 },
  { label: "14K", fine: 585 },
  { label: "9K", fine: 375 },
] as const;

export type KaratLabel = (typeof KARATS)[number]["label"];

export function fineFor(karat: string): number {
  return KARATS.find((k) => k.label === karat)?.fine ?? 750;
}

/** מחיר גרם זהב בדולר, לפי מחיר ספוט לאונקיית טרוי וטוהר הסגסוגת. */
export function goldPerGramUsd(fine: number, spotUsdOz: number): number {
  if (!spotUsdOz) return 0;
  return (spotUsdOz / GRAMS_PER_TROY_OZ) * (fine / 999);
}

export type CostInput = {
  karat: string;
  weightG: number;
  centerPricePerCt: number;
  centerCaratTotal: number;
  sideStonesOn: boolean;
  sidePricePerCt: number;
  sideCaratTotal: number;
  modelOn: boolean;
  modelPrice: number;
  goldsmithCost: number;
  centerSettingPrice: number;
  centerSettingQty: number;
  sideSettingPrice: number;
  sideSettingQty: number;
  rhodiumCost: number;
  boxCost: number;
  bagCost: number;
  packagingCost: number;
};

export type CostBreakdown = {
  goldPerGramUsd: number;
  gold: number;
  centerStone: number;
  sideStone: number;
  model: number;
  goldsmith: number;
  centerSetting: number;
  sideSetting: number;
  finishing: number;
  totalUsd: number;
};

const n = (v: number | null | undefined) => (Number.isFinite(v as number) ? (v as number) : 0);

export function costBreakdown(item: CostInput, spotUsdOz: number): CostBreakdown {
  const perGram = goldPerGramUsd(fineFor(item.karat), spotUsdOz);
  const gold = n(item.weightG) * perGram;
  const centerStone = n(item.centerPricePerCt) * n(item.centerCaratTotal);
  const sideStone = item.sideStonesOn ? n(item.sidePricePerCt) * n(item.sideCaratTotal) : 0;
  const model = item.modelOn ? n(item.modelPrice) : 0;
  const goldsmith = n(item.goldsmithCost);
  const centerSetting = n(item.centerSettingPrice) * n(item.centerSettingQty);
  const sideSetting = item.sideStonesOn ? n(item.sideSettingPrice) * n(item.sideSettingQty) : 0;
  const finishing =
    n(item.rhodiumCost) + n(item.boxCost) + n(item.bagCost) + n(item.packagingCost);

  const totalUsd =
    gold + centerStone + sideStone + model + goldsmith + centerSetting + sideSetting + finishing;

  return {
    goldPerGramUsd: perGram,
    gold,
    centerStone,
    sideStone,
    model,
    goldsmith,
    centerSetting,
    sideSetting,
    finishing,
    totalUsd,
  };
}

/** מדרגות המחיר של המחשבון. */
export const MULTIPLIER_TIERS = [1.3, 1.6, 2, 2.5, 3] as const;

/**
 * מכפיל על העלות אינו שיעור רווח: ×1.3 נותן 23% רווח ממחיר המכירה,
 * לא 30%. המערכת מציגה את שני המספרים כדי שלא יתומחר נמוך בטעות.
 */
export function marginPctFromMultiplier(multiplier: number): number {
  if (!multiplier) return 0;
  return ((multiplier - 1) / multiplier) * 100;
}

export function multiplierFromMarginPct(marginPct: number): number {
  const m = marginPct / 100;
  if (m >= 1) return 0;
  return 1 / (1 - m);
}

export type ItemPricing = {
  cost: CostBreakdown;
  /** מחיר יחידה לפני מע"מ, בדולר */
  unitPriceUsd: number;
  quantity: number;
  /** מחיר שורה לפני מע"מ, בדולר */
  linePriceUsd: number;
  lineCostUsd: number;
  profitUsd: number;
  marginPct: number;
};

export function priceItem(
  item: CostInput & {
    quantity: number;
    multiplier: number;
    priceOverrideUsd?: number | null;
  },
  spotUsdOz: number
): ItemPricing {
  const cost = costBreakdown(item, spotUsdOz);
  const qty = Math.max(1, n(item.quantity) || 1);
  const unitPriceUsd =
    item.priceOverrideUsd != null && item.priceOverrideUsd > 0
      ? item.priceOverrideUsd
      : cost.totalUsd * (n(item.multiplier) || 1);
  const linePriceUsd = unitPriceUsd * qty;
  const lineCostUsd = cost.totalUsd * qty;
  const profitUsd = linePriceUsd - lineCostUsd;

  return {
    cost,
    unitPriceUsd,
    quantity: qty,
    linePriceUsd,
    lineCostUsd,
    profitUsd,
    marginPct: linePriceUsd ? (profitUsd / linePriceUsd) * 100 : 0,
  };
}

export type OrderTotals = {
  subtotalUsd: number;
  costUsd: number;
  profitUsd: number;
  marginPct: number;
  vatPct: number;
  vatUsd: number;
  totalUsd: number;
  subtotalIls: number;
  vatIls: number;
  totalIls: number;
  depositUsd: number;
  depositIls: number;
};

/** סיכום הזמנה. ייצוא מאפס מע"מ — כאן, לא בזיכרון של מישהו. */
export function orderTotals(
  lines: ItemPricing[],
  opts: { isExport: boolean; vatPct: number; fx: number; depositPct: number }
): OrderTotals {
  const subtotalUsd = lines.reduce((a, l) => a + l.linePriceUsd, 0);
  const costUsd = lines.reduce((a, l) => a + l.lineCostUsd, 0);
  const profitUsd = subtotalUsd - costUsd;
  const vatPct = opts.isExport ? 0 : n(opts.vatPct);
  const vatUsd = subtotalUsd * (vatPct / 100);
  const totalUsd = subtotalUsd + vatUsd;
  const fx = n(opts.fx);

  return {
    subtotalUsd,
    costUsd,
    profitUsd,
    marginPct: subtotalUsd ? (profitUsd / subtotalUsd) * 100 : 0,
    vatPct,
    vatUsd,
    totalUsd,
    subtotalIls: subtotalUsd * fx,
    vatIls: vatUsd * fx,
    totalIls: totalUsd * fx,
    depositUsd: totalUsd * (n(opts.depositPct) / 100),
    depositIls: totalUsd * (n(opts.depositPct) / 100) * fx,
  };
}

/* ---------------------------------------------------------------
   יתרה לגבייה
   --------------------------------------------------------------- */
export type PaymentLike = { amountUsd: number; kind: string };

export type Balance = {
  paidUsd: number;
  refundedUsd: number;
  netPaidUsd: number;
  balanceUsd: number;
  depositRequiredUsd: number;
  depositPaid: boolean;
  isSettled: boolean;
};

/**
 * החזר מקטין את מה ששולם, ולכן מגדיל את היתרה.
 *
 * הסף ל"שולם במלואו" נגזר ממטבע התצוגה: שקלים מוצגים בלי אגורות, ולכן
 * יתרה של פחות מחצי שקל מוצגת כ-₪0 — ואם לא נחשיב אותה כסגורה, ההזמנה
 * תיתקע ברשימת הגבייה לנצח בזמן שהמסך מראה אפס.
 */
export function balanceFor(
  totals: { totalUsd: number; depositUsd: number },
  payments: PaymentLike[],
  opts?: { fx?: number; isExport?: boolean }
): Balance {
  const paidUsd = payments
    .filter((p) => p.kind !== "החזר")
    .reduce((a, p) => a + (Number.isFinite(p.amountUsd) ? p.amountUsd : 0), 0);
  const refundedUsd = payments
    .filter((p) => p.kind === "החזר")
    .reduce((a, p) => a + (Number.isFinite(p.amountUsd) ? p.amountUsd : 0), 0);
  const netPaidUsd = paidUsd - refundedUsd;
  const balanceUsd = totals.totalUsd - netPaidUsd;

  const fx = opts?.fx ?? 0;
  const tolerance =
    opts?.isExport || !fx
      ? 0.005 // דולר מוצג עם אגורות
      : 0.5 / fx; // חצי שקל, שמוצג כ-₪0

  return {
    paidUsd,
    refundedUsd,
    netPaidUsd,
    balanceUsd,
    depositRequiredUsd: totals.depositUsd,
    depositPaid: netPaidUsd + tolerance >= totals.depositUsd && totals.depositUsd > 0,
    isSettled: balanceUsd <= tolerance,
  };
}
