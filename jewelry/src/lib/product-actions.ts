"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireUser } from "./session";
import { makeSlug } from "./share";

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

/** מק״ט רץ: SAM-0001 */
async function nextSku(): Promise<string> {
  const rows = await db.select({ sku: schema.products.sku }).from(schema.products);
  const highest = rows
    .map((r) => Number(r.sku.replace(/^\D+/, "")))
    .filter((n) => Number.isFinite(n))
    .reduce((a, b) => Math.max(a, b), 0);
  return `SAM-${String(highest + 1).padStart(4, "0")}`;
}

function productFields(fd: FormData) {
  return {
    name: str(fd, "name") ?? "דגם",
    category: str(fd, "category") ?? "טבעת",
    description: str(fd, "description"),
    karat: str(fd, "karat") ?? "14K",
    metalColor: str(fd, "metalColor") ?? "צהוב",
    weightG: num(fd, "weightG"),
    centerStoneType: str(fd, "centerStoneType"),
    centerDesc: str(fd, "centerDesc"),
    centerCaratTotal: num(fd, "centerCaratTotal"),
    centerPricePerCt: num(fd, "centerPricePerCt"),
    sideStonesOn: bool(fd, "sideStonesOn"),
    sideStoneType: str(fd, "sideStoneType"),
    sideCaratTotal: num(fd, "sideCaratTotal"),
    sidePricePerCt: num(fd, "sidePricePerCt"),
    goldsmithCost: num(fd, "goldsmithCost"),
    centerSettingPrice: num(fd, "centerSettingPrice"),
    centerSettingQty: num(fd, "centerSettingQty"),
    sideSettingPrice: num(fd, "sideSettingPrice"),
    sideSettingQty: num(fd, "sideSettingQty"),
    rhodiumCost: num(fd, "rhodiumCost"),
    boxCost: num(fd, "boxCost"),
    bagCost: num(fd, "bagCost"),
    packagingCost: num(fd, "packagingCost"),
    multiplier: num(fd, "multiplier", 2),
    priceRetailUsd: fd.get("priceRetailUsd") ? num(fd, "priceRetailUsd") : null,
    priceWholesaleUsd: fd.get("priceWholesaleUsd") ? num(fd, "priceWholesaleUsd") : null,
    isAvailable: bool(fd, "isAvailable"),
    notes: str(fd, "notes"),
    updatedAt: nowIso(),
  };
}

export async function createProductAction(fd: FormData) {
  await requireUser();
  const id = randomUUID();
  await db.insert(schema.products).values({
    id,
    sku: str(fd, "sku") ?? (await nextSku()),
    ...productFields(fd),
    timesSold: 0,
    createdAt: nowIso(),
  });
  await insertPhotos(id, fd);
  revalidatePath("/catalog");
  redirect(`/catalog/${id}`);
}

export async function updateProductAction(fd: FormData) {
  await requireUser();
  const id = str(fd, "id");
  if (!id) return;
  await db.update(schema.products).set(productFields(fd)).where(eq(schema.products.id, id));
  await insertPhotos(id, fd);
  revalidatePath(`/catalog/${id}`);
  revalidatePath("/catalog");
  redirect(`/catalog/${id}`);
}

export async function deleteProductAction(fd: FormData) {
  await requireUser();
  const id = str(fd, "id");
  if (!id) return;
  await db.delete(schema.products).where(eq(schema.products.id, id));
  revalidatePath("/catalog");
  redirect("/catalog");
}

/** שומר פריט שכבר תומחר בהזמנה כדגם בקטלוג. ככה הקטלוג נבנה מעצמו. */
export async function saveItemAsProductAction(fd: FormData) {
  await requireUser();
  const itemId = str(fd, "itemId");
  if (!itemId) return;
  const rows = await db
    .select()
    .from(schema.orderItems)
    .where(eq(schema.orderItems.id, itemId))
    .limit(1);
  const item = rows[0];
  if (!item) return;

  const id = randomUUID();
  await db.insert(schema.products).values({
    id,
    sku: await nextSku(),
    name: item.name,
    category: item.category,
    description: null,
    karat: item.karat,
    metalColor: item.metalColor,
    weightG: item.weightG,
    centerStoneType: item.centerStoneType,
    centerDesc: item.centerDesc,
    centerCaratTotal: item.centerCaratTotal,
    centerPricePerCt: item.centerPricePerCt,
    sideStonesOn: item.sideStonesOn,
    sideStoneType: item.sideStoneType,
    sideCaratTotal: item.sideCaratTotal,
    sidePricePerCt: item.sidePricePerCt,
    goldsmithCost: item.goldsmithCost,
    centerSettingPrice: item.centerSettingPrice,
    centerSettingQty: item.centerSettingQty,
    sideSettingPrice: item.sideSettingPrice,
    sideSettingQty: item.sideSettingQty,
    rhodiumCost: item.rhodiumCost,
    boxCost: item.boxCost,
    bagCost: item.bagCost,
    packagingCost: item.packagingCost,
    multiplier: item.multiplier,
    priceRetailUsd: null,
    priceWholesaleUsd: null,
    isAvailable: true,
    timesSold: 0,
    notes: item.notes,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  });

  await db
    .update(schema.orderItems)
    .set({ productId: id })
    .where(eq(schema.orderItems.id, itemId));

  revalidatePath("/catalog");
  redirect(`/catalog/${id}`);
}

/* ---------------------------------------------------------------
   תמונות
   --------------------------------------------------------------- */
const MAX_PHOTO_BYTES = 3 * 1024 * 1024;

/**
 * קולט את כל שדות ה-`photo` מהטופס ושומר אותם כתמונות של הדגם.
 * משותף לטופס הדגם (שמירה ותמונות בפעולה אחת) ולהעלאה מעמוד הדגם.
 */
async function insertPhotos(productId: string, fd: FormData): Promise<number> {
  const entries = fd.getAll("photo").filter((e): e is string => typeof e === "string");
  if (!entries.length) return 0;

  const existing = await db
    .select({ n: sql<number>`count(*)` })
    .from(schema.productPhotos)
    .where(eq(schema.productPhotos.productId, productId));
  let order = Number(existing[0]?.n ?? 0);
  let uploaded = 0;

  for (const entry of entries) {
    const match = /^data:(image\/[a-z+]+);base64,(.+)$/i.exec(entry);
    if (!match) continue;
    const buffer = Buffer.from(match[2], "base64");
    if (buffer.byteLength > MAX_PHOTO_BYTES) continue;

    await db.insert(schema.productPhotos).values({
      id: randomUUID(),
      productId,
      mime: match[1],
      data: buffer,
      width: 0,
      height: 0,
      bytes: buffer.byteLength,
      sortOrder: order++,
      caption: null,
      createdAt: nowIso(),
    });
    uploaded++;
  }
  return uploaded;
}

export type UploadResult = { uploaded: number; at: number } | null;

export async function uploadPhotosAction(
  _prev: UploadResult,
  fd: FormData
): Promise<UploadResult> {
  await requireUser();
  const productId = str(fd, "productId");
  if (!productId) return { uploaded: 0, at: Date.now() };

  const uploaded = await insertPhotos(productId, fd);

  revalidatePath(`/catalog/${productId}`);
  revalidatePath("/catalog");
  return { uploaded, at: Date.now() };
}

export async function deletePhotoAction(fd: FormData) {
  await requireUser();
  const photoId = str(fd, "photoId");
  const productId = str(fd, "productId");
  if (!photoId) return;
  await db.delete(schema.productPhotos).where(eq(schema.productPhotos.id, photoId));
  if (productId) {
    revalidatePath(`/catalog/${productId}`);
    revalidatePath("/catalog");
  }
}

/** מזיז תמונה לראש הרשימה — היא הופכת לתמונה הראשית. */
export async function makePrimaryPhotoAction(fd: FormData) {
  await requireUser();
  const photoId = str(fd, "photoId");
  const productId = str(fd, "productId");
  if (!photoId || !productId) return;

  const photos = await db
    .select()
    .from(schema.productPhotos)
    .where(eq(schema.productPhotos.productId, productId))
    .orderBy(schema.productPhotos.sortOrder);

  const reordered = [
    ...photos.filter((p) => p.id === photoId),
    ...photos.filter((p) => p.id !== photoId),
  ];
  for (let i = 0; i < reordered.length; i++) {
    await db
      .update(schema.productPhotos)
      .set({ sortOrder: i })
      .where(eq(schema.productPhotos.id, reordered[i].id));
  }

  revalidatePath(`/catalog/${productId}`);
  revalidatePath("/catalog");
}


/* ---------------------------------------------------------------
   פרסום ושיתוף
   --------------------------------------------------------------- */
export async function toggleProductPublishAction(fd: FormData) {
  await requireUser();
  const id = str(fd, "id");
  if (!id) return;
  const rows = await db.select().from(schema.products).where(eq(schema.products.id, id)).limit(1);
  const product = rows[0];
  if (!product) return;

  await db
    .update(schema.products)
    .set({
      isPublished: !product.isPublished,
      // הסלאג נוצר פעם אחת ונשאר, כדי שלינק שכבר נשלח לא יישבר.
      shareSlug: product.shareSlug ?? makeSlug(product.sku),
      updatedAt: nowIso(),
    })
    .where(eq(schema.products.id, id));

  revalidatePath(`/catalog/${id}`);
  revalidatePath("/catalog");
}

export async function setProductPriceModeAction(fd: FormData) {
  await requireUser();
  const id = str(fd, "id");
  const mode = str(fd, "sharePriceMode");
  if (!id || !mode) return;
  await db
    .update(schema.products)
    .set({ sharePriceMode: mode, updatedAt: nowIso() })
    .where(eq(schema.products.id, id));
  revalidatePath(`/catalog/${id}`);
}

/* ---------------------------------------------------------------
   קולקציות
   --------------------------------------------------------------- */
export async function createCollectionAction(fd: FormData) {
  await requireUser();
  const title = str(fd, "title") ?? "מבחר";
  const id = randomUUID();
  await db.insert(schema.collections).values({
    id,
    slug: makeSlug(title.replace(/[^\w\s-]/g, "") || "selection"),
    title,
    subtitle: str(fd, "subtitle"),
    intro: str(fd, "intro"),
    customerId: str(fd, "customerId"),
    priceMode: str(fd, "priceMode") ?? "מחיר",
    isPublished: false,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  });
  revalidatePath("/collections");
  redirect(`/collections/${id}`);
}

export async function updateCollectionAction(fd: FormData) {
  await requireUser();
  const id = str(fd, "id");
  if (!id) return;
  await db
    .update(schema.collections)
    .set({
      title: str(fd, "title") ?? "מבחר",
      subtitle: str(fd, "subtitle"),
      intro: str(fd, "intro"),
      customerId: str(fd, "customerId"),
      priceMode: str(fd, "priceMode") ?? "מחיר",
      updatedAt: nowIso(),
    })
    .where(eq(schema.collections.id, id));
  revalidatePath(`/collections/${id}`);
  revalidatePath("/collections");
}

export async function toggleCollectionPublishAction(fd: FormData) {
  await requireUser();
  const id = str(fd, "id");
  if (!id) return;
  const rows = await db
    .select()
    .from(schema.collections)
    .where(eq(schema.collections.id, id))
    .limit(1);
  const collection = rows[0];
  if (!collection) return;
  await db
    .update(schema.collections)
    .set({ isPublished: !collection.isPublished, updatedAt: nowIso() })
    .where(eq(schema.collections.id, id));
  revalidatePath(`/collections/${id}`);
  revalidatePath("/collections");
}

export async function addToCollectionAction(fd: FormData) {
  await requireUser();
  const collectionId = str(fd, "collectionId");
  const productId = str(fd, "productId");
  if (!collectionId || !productId) return;

  const existing = await db
    .select()
    .from(schema.collectionItems)
    .where(eq(schema.collectionItems.collectionId, collectionId));
  if (existing.some((i) => i.productId === productId)) return;

  await db.insert(schema.collectionItems).values({
    id: randomUUID(),
    collectionId,
    productId,
    sortOrder: existing.length,
    note: null,
  });
  revalidatePath(`/collections/${collectionId}`);
}

export async function removeFromCollectionAction(fd: FormData) {
  await requireUser();
  const itemId = str(fd, "itemId");
  const collectionId = str(fd, "collectionId");
  if (!itemId) return;
  await db.delete(schema.collectionItems).where(eq(schema.collectionItems.id, itemId));
  if (collectionId) revalidatePath(`/collections/${collectionId}`);
}

export async function deleteCollectionAction(fd: FormData) {
  await requireUser();
  const id = str(fd, "id");
  if (!id) return;
  await db.delete(schema.collections).where(eq(schema.collections.id, id));
  revalidatePath("/collections");
  redirect("/collections");
}
