"use server";

import { randomUUID, randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireUser } from "./session";
import type { ApprovalResult } from "./customer-types";

const nowIso = () => new Date().toISOString();
const str = (fd: FormData, k: string) => {
  const v = fd.get(k);
  const s = typeof v === "string" ? v.trim() : "";
  return s.length ? s : null;
};

const MAX_PHOTO_BYTES = 3 * 1024 * 1024;

/* ---------------------------------------------------------------
   קישור עמוד הלקוח
   --------------------------------------------------------------- */
export async function toggleCustomerLinkAction(fd: FormData) {
  await requireUser();
  const id = str(fd, "id");
  if (!id) return;
  const rows = await db.select().from(schema.orders).where(eq(schema.orders.id, id)).limit(1);
  const order = rows[0];
  if (!order) return;

  await db
    .update(schema.orders)
    .set({
      customerLinkEnabled: !order.customerLinkEnabled,
      // הטוקן נוצר פעם אחת ונשאר, כדי שקישור שכבר נשלח לא יישבר.
      accessToken: order.accessToken ?? randomBytes(16).toString("hex"),
      updatedAt: nowIso(),
    })
    .where(eq(schema.orders.id, id));

  revalidatePath(`/orders/${id}`);
}

/* ---------------------------------------------------------------
   תמונות עיצוב
   --------------------------------------------------------------- */
export async function uploadOrderPhotosAction(fd: FormData) {
  await requireUser();
  const orderId = str(fd, "orderId");
  if (!orderId) return;

  const existing = await db
    .select({ id: schema.orderPhotos.id })
    .from(schema.orderPhotos)
    .where(eq(schema.orderPhotos.orderId, orderId));
  let order = existing.length;

  for (const entry of fd.getAll("photo")) {
    if (typeof entry !== "string") continue;
    const match = /^data:(image\/[a-z+]+);base64,(.+)$/i.exec(entry);
    if (!match) continue;
    const buffer = Buffer.from(match[2], "base64");
    if (buffer.byteLength > MAX_PHOTO_BYTES) continue;
    await db.insert(schema.orderPhotos).values({
      id: randomUUID(),
      orderId,
      kind: str(fd, "kind") ?? "עיצוב",
      mime: match[1],
      data: buffer,
      bytes: buffer.byteLength,
      caption: null,
      sortOrder: order++,
      createdAt: nowIso(),
    });
  }
  revalidatePath(`/orders/${orderId}`);
}

export async function deleteOrderPhotoAction(fd: FormData) {
  await requireUser();
  const photoId = str(fd, "photoId");
  const orderId = str(fd, "orderId");
  if (!photoId) return;
  await db.delete(schema.orderPhotos).where(eq(schema.orderPhotos.id, photoId));
  if (orderId) revalidatePath(`/orders/${orderId}`);
}

/* ---------------------------------------------------------------
   אישור העיצוב — מגיע מהלקוח, מאומת בטוקן
   --------------------------------------------------------------- */
export async function approveDesignAction(
  _prev: ApprovalResult,
  fd: FormData
): Promise<ApprovalResult> {
  const token = str(fd, "token");
  if (!token) return { ok: false, message: "הקישור אינו תקף", at: Date.now() };

  const rows = await db
    .select()
    .from(schema.orders)
    .where(eq(schema.orders.accessToken, token))
    .limit(1);
  const order = rows[0];
  if (!order || !order.customerLinkEnabled) {
    return { ok: false, message: "הקישור אינו תקף", at: Date.now() };
  }
  if (order.designApprovedAt) {
    return { ok: true, message: "העיצוב כבר אושר. תודה.", at: Date.now() };
  }

  const note = str(fd, "note");
  const approvedAt = nowIso();

  await db
    .update(schema.orders)
    .set({
      designApprovedAt: approvedAt,
      designApprovalNote: note,
      // אישור העיצוב מקדם את ההזמנה, אבל לא מדלג על שלבים שכבר עברו.
      status: order.status === "עיצוב" ? "אישור עיצוב" : order.status,
      updatedAt: approvedAt,
    })
    .where(eq(schema.orders.id, order.id));

  if (order.status === "עיצוב") {
    await db.insert(schema.orderStatusHistory).values({
      id: randomUUID(),
      orderId: order.id,
      fromStatus: order.status,
      toStatus: "אישור עיצוב",
      note: "הלקוח אישר את העיצוב",
      createdAt: approvedAt,
    });
  }

  await db.insert(schema.timelineEvents).values({
    id: randomUUID(),
    orderId: order.id,
    customerId: null,
    kind: "מערכת",
    title: "הלקוח אישר את העיצוב",
    body: note,
    eventDate: null,
    createdAt: approvedAt,
  });

  revalidatePath(`/order/${token}`);
  revalidatePath(`/orders/${order.id}`);
  revalidatePath("/");

  return { ok: true, message: "תודה. העיצוב אושר ואנחנו ממשיכים לייצור.", at: Date.now() };
}
