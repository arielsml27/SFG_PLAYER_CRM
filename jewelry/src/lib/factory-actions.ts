"use server";

import { randomUUID, randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireUser } from "./session";
import { FACTORY_SELECTABLE_STATUSES } from "./constants";
import type { FactoryUpdateResult } from "./factory-types";

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
   ספקים
   --------------------------------------------------------------- */
function supplierFields(fd: FormData) {
  return {
    name: str(fd, "name") ?? "ספק",
    type: str(fd, "type") ?? "מפעל ייצור",
    contactName: str(fd, "contactName"),
    phone: str(fd, "phone"),
    whatsapp: str(fd, "whatsapp"),
    email: str(fd, "email"),
    city: str(fd, "city"),
    paymentTerms: str(fd, "paymentTerms"),
    leadDays: Math.max(0, Math.round(num(fd, "leadDays"))),
    rating: Math.min(5, Math.max(0, Math.round(num(fd, "rating")))),
    isActive: bool(fd, "isActive"),
    notes: str(fd, "notes"),
    updatedAt: nowIso(),
  };
}

export async function createSupplierAction(fd: FormData) {
  await requireUser();
  const id = randomUUID();
  await db.insert(schema.suppliers).values({ id, ...supplierFields(fd), createdAt: nowIso() });
  revalidatePath("/suppliers");
  redirect(`/suppliers/${id}`);
}

export async function updateSupplierAction(fd: FormData) {
  await requireUser();
  const id = str(fd, "id");
  if (!id) return;
  await db.update(schema.suppliers).set(supplierFields(fd)).where(eq(schema.suppliers.id, id));
  revalidatePath(`/suppliers/${id}`);
  revalidatePath("/suppliers");
  redirect(`/suppliers/${id}`);
}

export async function deleteSupplierAction(fd: FormData) {
  await requireUser();
  const id = str(fd, "id");
  if (!id) return;
  const used = await db
    .select({ n: sql<number>`count(*)` })
    .from(schema.workOrders)
    .where(eq(schema.workOrders.supplierId, id));
  if (Number(used[0]?.n ?? 0) > 0) {
    throw new Error("לא ניתן למחוק ספק שיש לו הזמנות עבודה.");
  }
  await db.delete(schema.suppliers).where(eq(schema.suppliers.id, id));
  revalidatePath("/suppliers");
  redirect("/suppliers");
}

/* ---------------------------------------------------------------
   הזמנות עבודה
   --------------------------------------------------------------- */
async function nextWoNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const rows = await db.select({ woNumber: schema.workOrders.woNumber }).from(schema.workOrders);
  const prefix = `WO-${year}-`;
  const highest = rows
    .map((r) => r.woNumber)
    .filter((n) => n.startsWith(prefix))
    .map((n) => Number(n.slice(prefix.length)))
    .filter((n) => Number.isFinite(n))
    .reduce((a, b) => Math.max(a, b), 0);
  return `${prefix}${String(highest + 1).padStart(3, "0")}`;
}

export async function createWorkOrderAction(fd: FormData) {
  await requireUser();
  const orderId = str(fd, "orderId");
  const supplierId = str(fd, "supplierId");
  if (!orderId || !supplierId) return;

  const id = randomUUID();
  const status = "נשלח";
  await db.insert(schema.workOrders).values({
    id,
    woNumber: await nextWoNumber(),
    orderId,
    orderItemId: str(fd, "orderItemId"),
    supplierId,
    scope: str(fd, "scope") ?? "ייצור מלא",
    instructions: str(fd, "instructions"),
    status,
    sentAt: str(fd, "sentAt") ?? new Date().toISOString().slice(0, 10),
    dueDate: str(fd, "dueDate"),
    factoryEta: null,
    receivedAt: null,
    metalSentG: num(fd, "metalSentG"),
    metalReturnedG: 0,
    cost: num(fd, "cost"),
    costCurrency: str(fd, "costCurrency") ?? "ILS",
    // הטוקן שיישלח למפעל. נוצר פעם אחת כדי שהלינק לא יישבר.
    accessToken: randomBytes(16).toString("hex"),
    notes: null,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  });

  await db.insert(schema.workOrderUpdates).values({
    id: randomUUID(),
    workOrderId: id,
    author: "אני",
    status,
    eta: null,
    body: "הזמנת העבודה נפתחה",
    createdAt: nowIso(),
  });

  revalidatePath(`/orders/${orderId}`);
  revalidatePath("/work-orders");
}

export async function updateWorkOrderAction(fd: FormData) {
  await requireUser();
  const id = str(fd, "id");
  if (!id) return;
  const rows = await db.select().from(schema.workOrders).where(eq(schema.workOrders.id, id)).limit(1);
  const wo = rows[0];
  if (!wo) return;

  const status = str(fd, "status") ?? wo.status;
  await db
    .update(schema.workOrders)
    .set({
      scope: str(fd, "scope") ?? wo.scope,
      instructions: str(fd, "instructions"),
      status,
      dueDate: str(fd, "dueDate"),
      sentAt: str(fd, "sentAt"),
      receivedAt: status === "התקבל אצלי" ? str(fd, "receivedAt") ?? nowIso().slice(0, 10) : null,
      metalSentG: num(fd, "metalSentG", wo.metalSentG),
      metalReturnedG: num(fd, "metalReturnedG", wo.metalReturnedG),
      cost: num(fd, "cost", wo.cost),
      costCurrency: str(fd, "costCurrency") ?? wo.costCurrency,
      notes: str(fd, "notes"),
      updatedAt: nowIso(),
    })
    .where(eq(schema.workOrders.id, id));

  if (status !== wo.status) {
    await db.insert(schema.workOrderUpdates).values({
      id: randomUUID(),
      workOrderId: id,
      author: "אני",
      status,
      eta: null,
      body: null,
      createdAt: nowIso(),
    });
  }

  revalidatePath(`/orders/${wo.orderId}`);
  revalidatePath("/work-orders");
}

export async function deleteWorkOrderAction(fd: FormData) {
  await requireUser();
  const id = str(fd, "id");
  const orderId = str(fd, "orderId");
  if (!id) return;
  await db.delete(schema.workOrders).where(eq(schema.workOrders.id, id));
  if (orderId) revalidatePath(`/orders/${orderId}`);
  revalidatePath("/work-orders");
}

/** תמונות ייחוס שאני מצרף להזמנת העבודה. */
export async function uploadWorkOrderPhotosAction(fd: FormData) {
  await requireUser();
  const workOrderId = str(fd, "workOrderId");
  if (!workOrderId) return;
  await storePhotos(fd, workOrderId, "אני");
  const rows = await db
    .select({ orderId: schema.workOrders.orderId })
    .from(schema.workOrders)
    .where(eq(schema.workOrders.id, workOrderId))
    .limit(1);
  if (rows[0]) revalidatePath(`/orders/${rows[0].orderId}`);
}

const MAX_PHOTO_BYTES = 3 * 1024 * 1024;

async function storePhotos(fd: FormData, workOrderId: string, author: string) {
  for (const entry of fd.getAll("photo")) {
    if (typeof entry !== "string") continue;
    const match = /^data:(image\/[a-z+]+);base64,(.+)$/i.exec(entry);
    if (!match) continue;
    const buffer = Buffer.from(match[2], "base64");
    if (buffer.byteLength > MAX_PHOTO_BYTES) continue;
    await db.insert(schema.workOrderPhotos).values({
      id: randomUUID(),
      workOrderId,
      author,
      mime: match[1],
      data: buffer,
      bytes: buffer.byteLength,
      caption: null,
      createdAt: nowIso(),
    });
  }
}

/* ---------------------------------------------------------------
   פורטל המפעל — פעולות שמאומתות בטוקן ולא בסשן
   --------------------------------------------------------------- */
async function workOrderByToken(token: string | null) {
  if (!token) return null;
  const rows = await db
    .select()
    .from(schema.workOrders)
    .where(eq(schema.workOrders.accessToken, token))
    .limit(1);
  return rows[0] ?? null;
}

export async function factoryUpdateAction(
  _prev: FactoryUpdateResult,
  fd: FormData
): Promise<FactoryUpdateResult> {
  const token = str(fd, "token");
  const wo = await workOrderByToken(token);
  if (!wo) return { ok: false, message: "הקישור אינו תקף", at: Date.now() };

  const status = str(fd, "status");
  const eta = str(fd, "eta");
  const body = str(fd, "body");

  // המפעל יכול לבחור רק מתוך הסטטוסים שלו. "התקבל אצלי" הוא שלי בלבד.
  const nextStatus =
    status && (FACTORY_SELECTABLE_STATUSES as readonly string[]).includes(status)
      ? status
      : null;

  if (!nextStatus && !eta && !body && fd.getAll("photo").length === 0) {
    return { ok: false, message: "אין מה לעדכן", at: Date.now() };
  }

  await db.insert(schema.workOrderUpdates).values({
    id: randomUUID(),
    workOrderId: wo.id,
    author: "מפעל",
    status: nextStatus,
    eta,
    body,
    createdAt: nowIso(),
  });

  await storePhotos(fd, wo.id, "מפעל");

  await db
    .update(schema.workOrders)
    .set({
      status: nextStatus ?? wo.status,
      factoryEta: eta ?? wo.factoryEta,
      updatedAt: nowIso(),
    })
    .where(eq(schema.workOrders.id, wo.id));

  revalidatePath(`/factory/${token}`);
  revalidatePath(`/orders/${wo.orderId}`);
  revalidatePath("/work-orders");
  revalidatePath("/");

  return { ok: true, message: "העדכון נשמר. תודה.", at: Date.now() };
}

