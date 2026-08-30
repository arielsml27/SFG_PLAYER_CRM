"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cookies, headers } from "next/headers";
import { desc, eq, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { AUTH_COOKIE, signSessionToken } from "./auth";
import { verifyPassword } from "./password";
import { checkLoginAllowed, clearLoginAttempts, recordFailedLogin } from "./login-guard";
import { requireUser } from "./session";
import { getSettings } from "./data";

const nowIso = () => new Date().toISOString();
const str = (fd: FormData, k: string) => {
  const v = fd.get(k);
  const s = typeof v === "string" ? v.trim() : "";
  return s.length ? s : null;
};
const num = (fd: FormData, k: string, fallback = 0) => {
  const v = Number(fd.get(k));
  return Number.isFinite(v) ? v : fallback;
};
const bool = (fd: FormData, k: string) => fd.get(k) === "on" || fd.get(k) === "true";

/* ---------------------------------------------------------------
   התחברות
   --------------------------------------------------------------- */
export async function loginAction(_prev: string | null, fd: FormData): Promise<string | null> {
  const email = (str(fd, "email") ?? "").toLowerCase();
  const password = str(fd, "password") ?? "";
  if (!email || !password) return "יש להזין אימייל וסיסמה";

  // מפתח ההגבלה הוא כתובת ה-IP של הפונה, כדי שניחוש אוטומטי ייחסם
  // גם אם הוא מנסה כתובות מייל שונות.
  const h = await headers();
  const ip =
    h.get("cf-connecting-ip") ??
    h.get("x-forwarded-for")?.split(",")[0].trim() ??
    "local";

  const gate = checkLoginAllowed(ip);
  if (!gate.allowed) {
    return `יותר מדי ניסיונות כניסה. נסה שוב בעוד ${gate.retryInMinutes} דקות.`;
  }

  const rows = await db.select().from(schema.users).where(eq(schema.users.email, email)).limit(1);
  const user = rows[0];
  if (!user || !verifyPassword(password, user.passwordHash)) {
    recordFailedLogin(ip);
    return "אימייל או סיסמה שגויים";
  }
  clearLoginAttempts(ip);

  (await cookies()).set(AUTH_COOKIE, await signSessionToken(user.id), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    // כשהמערכת חשופה מבחוץ היא מוגשת ב-HTTPS, והעוגייה לא צריכה
    // לעבור בערוץ פתוח.
    secure: (process.env.PUBLIC_BASE_URL ?? "").startsWith("https://"),
    maxAge: 60 * 60 * 24 * 30,
  });
  redirect("/");
}

export async function logoutAction() {
  (await cookies()).delete(AUTH_COOKIE);
  redirect("/login");
}

/* ---------------------------------------------------------------
   הגדרות ושערים
   --------------------------------------------------------------- */
export async function saveSettingsAction(fd: FormData) {
  await requireUser();
  const current = await getSettings();
  const next = {
    goldSpotUsdOz: num(fd, "goldSpotUsdOz", current.goldSpotUsdOz),
    fxUsdIls: num(fd, "fxUsdIls", current.fxUsdIls),
    vatPct: num(fd, "vatPct", current.vatPct),
    defaultMultiplier: num(fd, "defaultMultiplier", current.defaultMultiplier),
    defaultDepositPct: num(fd, "defaultDepositPct", current.defaultDepositPct),
    businessName: str(fd, "businessName") ?? current.businessName,
    whatsappNumber: str(fd, "whatsappNumber"),
    instagramHandle: str(fd, "instagramHandle"),
    publicBaseUrl: str(fd, "publicBaseUrl"),
    updatedAt: nowIso(),
  };
  await db.update(schema.settings).set(next).where(eq(schema.settings.id, "singleton"));

  // כל עדכון שער נשמר בהיסטוריה, גם אם הוא זהה — כדי שיהיה ציר זמן מלא.
  await db.insert(schema.rateHistory).values({
    id: randomUUID(),
    goldSpotUsdOz: next.goldSpotUsdOz,
    fxUsdIls: next.fxUsdIls,
    vatPct: next.vatPct,
    createdAt: nowIso(),
  });

  revalidatePath("/settings");
  revalidatePath("/");
}

/* ---------------------------------------------------------------
   לקוחות
   --------------------------------------------------------------- */
function customerFields(fd: FormData) {
  return {
    name: str(fd, "name") ?? "ללא שם",
    type: str(fd, "type") ?? "פרטי",
    phone: str(fd, "phone"),
    whatsapp: str(fd, "whatsapp"),
    email: str(fd, "email"),
    instagram: str(fd, "instagram"),
    country: str(fd, "country") ?? "ישראל",
    city: str(fd, "city"),
    address: str(fd, "address"),
    source: str(fd, "source"),
    referredBy: str(fd, "referredBy"),
    defaultExport: bool(fd, "defaultExport"),
    status: str(fd, "status") ?? "פעיל",
    notes: str(fd, "notes"),
    updatedAt: nowIso(),
  };
}

export async function createCustomerAction(fd: FormData) {
  await requireUser();
  const id = randomUUID();
  await db.insert(schema.customers).values({ id, ...customerFields(fd), createdAt: nowIso() });
  revalidatePath("/customers");
  redirect(`/customers/${id}`);
}

export async function updateCustomerAction(fd: FormData) {
  await requireUser();
  const id = str(fd, "id");
  if (!id) return;
  await db.update(schema.customers).set(customerFields(fd)).where(eq(schema.customers.id, id));
  revalidatePath(`/customers/${id}`);
  revalidatePath("/customers");
  redirect(`/customers/${id}`);
}

export async function deleteCustomerAction(fd: FormData) {
  await requireUser();
  const id = str(fd, "id");
  if (!id) return;
  const orders = await db
    .select({ n: sql<number>`count(*)` })
    .from(schema.orders)
    .where(eq(schema.orders.customerId, id));
  if (Number(orders[0]?.n ?? 0) > 0) {
    throw new Error("לא ניתן למחוק לקוח שיש לו הזמנות. מחק או העבר את ההזמנות קודם.");
  }
  await db.delete(schema.customers).where(eq(schema.customers.id, id));
  revalidatePath("/customers");
  redirect("/customers");
}

/* ---------------------------------------------------------------
   הזמנות
   --------------------------------------------------------------- */
async function nextOrderNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const rows = await db
    .select({ orderNumber: schema.orders.orderNumber })
    .from(schema.orders)
    .orderBy(desc(schema.orders.orderNumber));
  const prefix = `${year}-`;
  const highest = rows
    .map((r) => r.orderNumber)
    .filter((n) => n.startsWith(prefix))
    .map((n) => Number(n.slice(prefix.length)))
    .filter((n) => Number.isFinite(n))
    .reduce((a, b) => Math.max(a, b), 0);
  return `${prefix}${String(highest + 1).padStart(3, "0")}`;
}

export async function createOrderAction(fd: FormData) {
  await requireUser();
  const settings = await getSettings();
  const customerId = str(fd, "customerId");
  if (!customerId) throw new Error("יש לבחור לקוח");

  const id = randomUUID();
  const status = str(fd, "status") ?? "פנייה";
  await db.insert(schema.orders).values({
    id,
    orderNumber: await nextOrderNumber(),
    customerId,
    type: str(fd, "type") ?? "בהזמנה",
    channel: str(fd, "channel") ?? "וואטסאפ",
    status,
    priority: str(fd, "priority") ?? "רגיל",
    isExport: bool(fd, "isExport"),
    eventDate: str(fd, "eventDate"),
    promisedDate: str(fd, "promisedDate"),
    internalDueDate: str(fd, "internalDueDate"),
    deliveredAt: null,
    // צילום השערים ברגע פתיחת ההזמנה
    goldSpotSnapshot: settings.goldSpotUsdOz,
    fxSnapshot: settings.fxUsdIls,
    vatSnapshot: settings.vatPct,
    depositPct: num(fd, "depositPct", settings.defaultDepositPct),
    greenInvoiceNumber: null,
    notes: str(fd, "notes"),
    createdAt: nowIso(),
    updatedAt: nowIso(),
  });

  await db.insert(schema.orderStatusHistory).values({
    id: randomUUID(),
    orderId: id,
    fromStatus: null,
    toStatus: status,
    note: "ההזמנה נפתחה",
    createdAt: nowIso(),
  });

  revalidatePath("/orders");
  redirect(`/orders/${id}`);
}

export async function updateOrderAction(fd: FormData) {
  await requireUser();
  const id = str(fd, "id");
  if (!id) return;
  await db
    .update(schema.orders)
    .set({
      customerId: str(fd, "customerId") ?? undefined,
      type: str(fd, "type") ?? "בהזמנה",
      channel: str(fd, "channel") ?? "וואטסאפ",
      priority: str(fd, "priority") ?? "רגיל",
      isExport: bool(fd, "isExport"),
      eventDate: str(fd, "eventDate"),
      promisedDate: str(fd, "promisedDate"),
      internalDueDate: str(fd, "internalDueDate"),
      depositPct: num(fd, "depositPct", 30),
      greenInvoiceNumber: str(fd, "greenInvoiceNumber"),
      notes: str(fd, "notes"),
      updatedAt: nowIso(),
    })
    .where(eq(schema.orders.id, id));
  revalidatePath(`/orders/${id}`);
  revalidatePath("/orders");
}

/** שינוי סטטוס — תמיד נרשם ביומן, אחרת אין דרך לדעת כמה זמן לוקח כל שלב. */
export async function setOrderStatusAction(fd: FormData) {
  await requireUser();
  const id = str(fd, "id");
  const toStatus = str(fd, "status");
  if (!id || !toStatus) return;

  const rows = await db.select().from(schema.orders).where(eq(schema.orders.id, id)).limit(1);
  const order = rows[0];
  if (!order || order.status === toStatus) return;

  await db
    .update(schema.orders)
    .set({
      status: toStatus,
      deliveredAt: toStatus === "נמסר" ? nowIso() : order.deliveredAt,
      updatedAt: nowIso(),
    })
    .where(eq(schema.orders.id, id));

  await db.insert(schema.orderStatusHistory).values({
    id: randomUUID(),
    orderId: id,
    fromStatus: order.status,
    toStatus,
    note: str(fd, "note"),
    createdAt: nowIso(),
  });

  revalidatePath(`/orders/${id}`);
  revalidatePath("/orders");
  revalidatePath("/");
}

/** רענון השערים על הזמנה קיימת — פעולה מודעת, לא אוטומטית. */
export async function refreshOrderRatesAction(fd: FormData) {
  await requireUser();
  const id = str(fd, "id");
  if (!id) return;
  const settings = await getSettings();
  await db
    .update(schema.orders)
    .set({
      goldSpotSnapshot: settings.goldSpotUsdOz,
      fxSnapshot: settings.fxUsdIls,
      vatSnapshot: settings.vatPct,
      updatedAt: nowIso(),
    })
    .where(eq(schema.orders.id, id));
  await db.insert(schema.timelineEvents).values({
    id: randomUUID(),
    orderId: id,
    customerId: null,
    kind: "מערכת",
    title: "השערים עודכנו לשערי היום",
    body: null,
    eventDate: null,
    createdAt: nowIso(),
  });
  revalidatePath(`/orders/${id}`);
}

export async function deleteOrderAction(fd: FormData) {
  await requireUser();
  const id = str(fd, "id");
  if (!id) return;
  await db.delete(schema.orders).where(eq(schema.orders.id, id));
  revalidatePath("/orders");
  redirect("/orders");
}

/* ---------------------------------------------------------------
   פריטי הזמנה — כרטיס הפריט של המחשבון
   --------------------------------------------------------------- */
function itemFields(fd: FormData) {
  return {
    name: str(fd, "name") ?? "פריט",
    category: str(fd, "category") ?? "טבעת",
    notes: str(fd, "notes"),
    karat: str(fd, "karat") ?? "18K",
    metalColor: str(fd, "metalColor") ?? "צהוב",
    weightG: num(fd, "weightG"),
    centerStoneType: str(fd, "centerStoneType"),
    centerDesc: str(fd, "centerDesc"),
    centerPricePerCt: num(fd, "centerPricePerCt"),
    centerCaratTotal: num(fd, "centerCaratTotal"),
    sideStonesOn: bool(fd, "sideStonesOn"),
    sideStoneType: str(fd, "sideStoneType"),
    sideDesc: str(fd, "sideDesc"),
    sidePricePerCt: num(fd, "sidePricePerCt"),
    sideCaratTotal: num(fd, "sideCaratTotal"),
    modelOn: bool(fd, "modelOn"),
    modelPrice: num(fd, "modelPrice"),
    goldsmithCost: num(fd, "goldsmithCost"),
    centerSettingPrice: num(fd, "centerSettingPrice"),
    centerSettingQty: num(fd, "centerSettingQty"),
    sideSettingPrice: num(fd, "sideSettingPrice"),
    sideSettingQty: num(fd, "sideSettingQty"),
    rhodiumCost: num(fd, "rhodiumCost"),
    boxCost: num(fd, "boxCost"),
    bagCost: num(fd, "bagCost"),
    packagingCost: num(fd, "packagingCost"),
    productId: str(fd, "productId"),
    size: str(fd, "size"),
    engraving: str(fd, "engraving"),
    quantity: Math.max(1, Math.round(num(fd, "quantity", 1))),
    multiplier: num(fd, "multiplier", 2),
    priceOverrideUsd: fd.get("priceOverrideUsd") ? num(fd, "priceOverrideUsd") : null,
  };
}

export async function saveOrderItemAction(fd: FormData) {
  await requireUser();
  const orderId = str(fd, "orderId");
  if (!orderId) return;
  const itemId = str(fd, "itemId");

  if (itemId) {
    await db.update(schema.orderItems).set(itemFields(fd)).where(eq(schema.orderItems.id, itemId));
  } else {
    const existing = await db
      .select({ n: sql<number>`count(*)` })
      .from(schema.orderItems)
      .where(eq(schema.orderItems.orderId, orderId));
    await db.insert(schema.orderItems).values({
      id: randomUUID(),
      orderId,
      sortOrder: Number(existing[0]?.n ?? 0),
      ...itemFields(fd),
      createdAt: nowIso(),
    });
  }
  await db
    .update(schema.orders)
    .set({ updatedAt: nowIso() })
    .where(eq(schema.orders.id, orderId));

  revalidatePath(`/orders/${orderId}`);
  redirect(`/orders/${orderId}?tab=items`);
}

export async function deleteOrderItemAction(fd: FormData) {
  await requireUser();
  const itemId = str(fd, "itemId");
  const orderId = str(fd, "orderId");
  if (!itemId) return;
  await db.delete(schema.orderItems).where(eq(schema.orderItems.id, itemId));
  if (orderId) revalidatePath(`/orders/${orderId}`);
}

/* ---------------------------------------------------------------
   יומן ומשימות
   --------------------------------------------------------------- */
export async function addTimelineEventAction(fd: FormData) {
  await requireUser();
  const orderId = str(fd, "orderId");
  const customerId = str(fd, "customerId");
  const title = str(fd, "title");
  if (!title) return;
  await db.insert(schema.timelineEvents).values({
    id: randomUUID(),
    orderId,
    customerId,
    kind: str(fd, "kind") ?? "הערה",
    title,
    body: str(fd, "body"),
    eventDate: str(fd, "eventDate"),
    createdAt: nowIso(),
  });
  if (orderId) revalidatePath(`/orders/${orderId}`);
  if (customerId) revalidatePath(`/customers/${customerId}`);
}

export async function createTaskAction(fd: FormData) {
  await requireUser();
  const title = str(fd, "title");
  if (!title) return;
  await db.insert(schema.tasks).values({
    id: randomUUID(),
    title,
    notes: str(fd, "notes"),
    dueDate: str(fd, "dueDate"),
    priority: str(fd, "priority") ?? "רגיל",
    status: "פתוח",
    orderId: str(fd, "orderId"),
    customerId: str(fd, "customerId"),
    completedAt: null,
    createdAt: nowIso(),
  });
  revalidatePath("/tasks");
  revalidatePath("/");
  const orderId = str(fd, "orderId");
  if (orderId) revalidatePath(`/orders/${orderId}`);
}

export async function toggleTaskAction(fd: FormData) {
  await requireUser();
  const id = str(fd, "id");
  if (!id) return;
  const rows = await db.select().from(schema.tasks).where(eq(schema.tasks.id, id)).limit(1);
  const task = rows[0];
  if (!task) return;
  const done = task.status === "הושלם";
  await db
    .update(schema.tasks)
    .set({ status: done ? "פתוח" : "הושלם", completedAt: done ? null : nowIso() })
    .where(eq(schema.tasks.id, id));
  revalidatePath("/tasks");
  revalidatePath("/");
  if (task.orderId) revalidatePath(`/orders/${task.orderId}`);
}

export async function deleteTaskAction(fd: FormData) {
  await requireUser();
  const id = str(fd, "id");
  if (!id) return;
  await db.delete(schema.tasks).where(eq(schema.tasks.id, id));
  revalidatePath("/tasks");
}

/* ---------------------------------------------------------------
   תשלומים
   --------------------------------------------------------------- */
export async function addPaymentAction(fd: FormData) {
  await requireUser();
  const orderId = str(fd, "orderId");
  if (!orderId) return;

  const rows = await db.select().from(schema.orders).where(eq(schema.orders.id, orderId)).limit(1);
  const order = rows[0];
  if (!order) return;

  const amount = num(fd, "amount");
  if (amount <= 0) return;

  const currency = str(fd, "currency") ?? "ILS";
  const settings = await getSettings();
  // שער ההמרה של יום התשלום. ההזמנה שומרת שער משלה לתמחור, אבל
  // תשלום שהתקבל היום הומר בשער של היום.
  const fx = settings.fxUsdIls || order.fxSnapshot || 0;
  const amountUsd = currency === "USD" ? amount : fx ? amount / fx : 0;

  await db.insert(schema.payments).values({
    id: randomUUID(),
    orderId,
    kind: str(fd, "kind") ?? "מקדמה",
    amount,
    currency,
    fxAtPayment: fx,
    amountUsd,
    paidAt: str(fd, "paidAt") ?? new Date().toISOString().slice(0, 10),
    method: str(fd, "method") ?? "העברה",
    reference: str(fd, "reference"),
    greenInvoiceNumber: str(fd, "greenInvoiceNumber"),
    notes: str(fd, "notes"),
    createdAt: nowIso(),
  });

  await db
    .update(schema.orders)
    .set({ updatedAt: nowIso() })
    .where(eq(schema.orders.id, orderId));

  revalidatePath(`/orders/${orderId}`);
  revalidatePath("/receivables");
  revalidatePath("/");
}

export async function deletePaymentAction(fd: FormData) {
  await requireUser();
  const paymentId = str(fd, "paymentId");
  const orderId = str(fd, "orderId");
  if (!paymentId) return;
  await db.delete(schema.payments).where(eq(schema.payments.id, paymentId));
  if (orderId) revalidatePath(`/orders/${orderId}`);
  revalidatePath("/receivables");
  revalidatePath("/");
}

/* ---------------------------------------------------------------
   גיבוי
   --------------------------------------------------------------- */
export async function runBackupAction() {
  await requireUser();
  const { runBackup } = await import("./backup");
  runBackup();
  revalidatePath("/settings");
}

/* ---------------------------------------------------------------
   הוצאות
   --------------------------------------------------------------- */
export async function createExpenseAction(fd: FormData) {
  await requireUser();
  const amount = num(fd, "amount");
  const description = str(fd, "description");
  if (amount <= 0 || !description) return;

  const settings = await getSettings();
  const currency = str(fd, "currency") ?? "ILS";
  const fx = settings.fxUsdIls || 0;
  const amountUsd = currency === "USD" ? amount : fx ? amount / fx : 0;

  await db.insert(schema.expenses).values({
    id: randomUUID(),
    spentAt: str(fd, "spentAt") ?? new Date().toISOString().slice(0, 10),
    category: str(fd, "category") ?? "אחר",
    description,
    amount,
    currency,
    fxAtSpend: fx,
    amountUsd,
    supplierId: str(fd, "supplierId"),
    invoiceNumber: str(fd, "invoiceNumber"),
    isRecurring: bool(fd, "isRecurring"),
    notes: str(fd, "notes"),
    createdAt: nowIso(),
  });

  revalidatePath("/expenses");
  revalidatePath("/reports");
}

export async function deleteExpenseAction(fd: FormData) {
  await requireUser();
  const id = str(fd, "id");
  if (!id) return;
  await db.delete(schema.expenses).where(eq(schema.expenses.id, id));
  revalidatePath("/expenses");
  revalidatePath("/reports");
}
