import { desc, eq, inArray, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { CLOSED_STATUSES } from "./constants";
import { balanceFor, orderTotals, priceItem, type Balance, type ItemPricing } from "./pricing";

export type Settings = typeof schema.settings.$inferSelect;
export type Customer = typeof schema.customers.$inferSelect;
export type Order = typeof schema.orders.$inferSelect;
export type OrderItem = typeof schema.orderItems.$inferSelect;

const SINGLETON = "singleton";

export async function getSettings(): Promise<Settings> {
  const rows = await db.select().from(schema.settings).where(eq(schema.settings.id, SINGLETON));
  if (rows[0]) return rows[0];
  const fresh: Settings = {
    id: SINGLETON,
    goldSpotUsdOz: 0,
    fxUsdIls: 0,
    vatPct: 18,
    defaultMultiplier: 2,
    defaultDepositPct: 30,
    businessName: "Samuel",
    whatsappNumber: null,
    instagramHandle: null,
    publicBaseUrl: null,
    updatedAt: new Date().toISOString(),
  };
  await db.insert(schema.settings).values(fresh);
  return fresh;
}

/* ---------------------------------------------------------------
   לקוחות
   --------------------------------------------------------------- */
export async function listCustomers(query?: string) {
  const rows = await db.select().from(schema.customers).orderBy(desc(schema.customers.updatedAt));
  const counts = await db
    .select({ customerId: schema.orders.customerId, n: sql<number>`count(*)` })
    .from(schema.orders)
    .groupBy(schema.orders.customerId);
  const byCustomer = new Map(counts.map((c) => [c.customerId, Number(c.n)]));

  const q = query?.trim().toLowerCase();
  return rows
    .filter((c) =>
      !q
        ? true
        : [c.name, c.phone, c.whatsapp, c.email, c.instagram, c.city]
            .filter(Boolean)
            .some((f) => String(f).toLowerCase().includes(q))
    )
    .map((c) => ({ ...c, orderCount: byCustomer.get(c.id) ?? 0 }));
}

export async function getCustomer(id: string) {
  const rows = await db.select().from(schema.customers).where(eq(schema.customers.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function getCustomerOrders(customerId: string) {
  return db
    .select()
    .from(schema.orders)
    .where(eq(schema.orders.customerId, customerId))
    .orderBy(desc(schema.orders.createdAt));
}

/* ---------------------------------------------------------------
   הזמנות
   --------------------------------------------------------------- */
export type OrderRow = Order & {
  customerName: string;
  itemCount: number;
  totalUsd: number;
  totalIls: number;
  balanceUsd: number;
  balanceIls: number;
  isSettled: boolean;
};

async function decorateOrders(rows: Order[]): Promise<OrderRow[]> {
  if (rows.length === 0) return [];
  const ids = rows.map((o) => o.id);
  const items = await db
    .select()
    .from(schema.orderItems)
    .where(inArray(schema.orderItems.orderId, ids));
  const customers = await db.select().from(schema.customers);
  const nameById = new Map(customers.map((c) => [c.id, c.name]));
  const allPayments = await db
    .select()
    .from(schema.payments)
    .where(inArray(schema.payments.orderId, ids));

  return rows.map((o) => {
    const mine = items.filter((i) => i.orderId === o.id);
    const lines = mine.map((i) => priceItem(i, o.goldSpotSnapshot));
    const totals = orderTotals(lines, {
      isExport: o.isExport,
      vatPct: o.vatSnapshot,
      fx: o.fxSnapshot,
      depositPct: o.depositPct,
    });
    const balance = balanceFor(totals, allPayments.filter((p) => p.orderId === o.id), {
      fx: o.fxSnapshot,
      isExport: o.isExport,
    });
    return {
      ...o,
      customerName: nameById.get(o.customerId) ?? "—",
      itemCount: mine.length,
      totalUsd: totals.totalUsd,
      totalIls: totals.totalIls,
      balanceUsd: balance.balanceUsd,
      balanceIls: balance.balanceUsd * o.fxSnapshot,
      isSettled: balance.isSettled,
    };
  });
}

export async function listOrders(filter?: { status?: string; query?: string }) {
  const rows = await db.select().from(schema.orders).orderBy(desc(schema.orders.createdAt));
  const decorated = await decorateOrders(rows);
  const q = filter?.query?.trim().toLowerCase();
  return decorated.filter((o) => {
    if (filter?.status && filter.status !== "הכל" && o.status !== filter.status) return false;
    if (!q) return true;
    return [o.orderNumber, o.customerName, o.notes]
      .filter(Boolean)
      .some((f) => String(f).toLowerCase().includes(q));
  });
}

export type FullOrder = {
  order: Order;
  customer: Customer | null;
  items: OrderItem[];
  lines: ItemPricing[];
  totals: ReturnType<typeof orderTotals>;
  history: (typeof schema.orderStatusHistory.$inferSelect)[];
  timeline: (typeof schema.timelineEvents.$inferSelect)[];
  tasks: (typeof schema.tasks.$inferSelect)[];
  payments: (typeof schema.payments.$inferSelect)[];
  balance: Balance;
};

export async function getOrder(id: string): Promise<FullOrder | null> {
  const rows = await db.select().from(schema.orders).where(eq(schema.orders.id, id)).limit(1);
  const order = rows[0];
  if (!order) return null;

  const [customer, items, history, timeline, orderTasks, orderPayments] = await Promise.all([
    getCustomer(order.customerId),
    db
      .select()
      .from(schema.orderItems)
      .where(eq(schema.orderItems.orderId, id))
      .orderBy(schema.orderItems.sortOrder),
    db
      .select()
      .from(schema.orderStatusHistory)
      .where(eq(schema.orderStatusHistory.orderId, id))
      .orderBy(desc(schema.orderStatusHistory.createdAt)),
    db
      .select()
      .from(schema.timelineEvents)
      .where(eq(schema.timelineEvents.orderId, id))
      .orderBy(desc(schema.timelineEvents.createdAt)),
    db.select().from(schema.tasks).where(eq(schema.tasks.orderId, id)).orderBy(schema.tasks.dueDate),
    db
      .select()
      .from(schema.payments)
      .where(eq(schema.payments.orderId, id))
      .orderBy(schema.payments.paidAt),
  ]);

  const lines = items.map((i) => priceItem(i, order.goldSpotSnapshot));
  const totals = orderTotals(lines, {
    isExport: order.isExport,
    vatPct: order.vatSnapshot,
    fx: order.fxSnapshot,
    depositPct: order.depositPct,
  });

  return {
    order,
    customer,
    items,
    lines,
    totals,
    history,
    timeline,
    tasks: orderTasks,
    payments: orderPayments,
    balance: balanceFor(totals, orderPayments, {
      fx: order.fxSnapshot,
      isExport: order.isExport,
    }),
  };
}

/* ---------------------------------------------------------------
   משימות
   --------------------------------------------------------------- */
export async function listTasks(includeDone = false) {
  const rows = await db
    .select()
    .from(schema.tasks)
    .where(includeDone ? undefined : eq(schema.tasks.status, "פתוח"))
    .orderBy(schema.tasks.dueDate);

  const orders = await db.select().from(schema.orders);
  const customers = await db.select().from(schema.customers);
  const orderById = new Map(orders.map((o) => [o.id, o.orderNumber]));
  const customerById = new Map(customers.map((c) => [c.id, c.name]));

  return rows.map((t) => ({
    ...t,
    orderNumber: t.orderId ? orderById.get(t.orderId) ?? null : null,
    customerName: t.customerId ? customerById.get(t.customerId) ?? null : null,
  }));
}

/* ---------------------------------------------------------------
   דשבורד
   --------------------------------------------------------------- */
export async function getDashboard() {
  const settings = await getSettings();
  const allOrders = await db.select().from(schema.orders);
  const open = allOrders.filter((o) => !CLOSED_STATUSES.has(o.status));
  const decorated = await decorateOrders(open);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const inDays = (iso: string | null) => {
    if (!iso) return null;
    const d = new Date(iso + "T00:00:00");
    if (Number.isNaN(d.getTime())) return null;
    return Math.round((d.getTime() - today.getTime()) / 86400000);
  };

  const late = decorated
    .filter((o) => {
      const d = inDays(o.promisedDate);
      return d !== null && d < 0;
    })
    .sort((a, b) => (a.promisedDate ?? "").localeCompare(b.promisedDate ?? ""));

  const thisWeek = decorated
    .filter((o) => {
      const d = inDays(o.promisedDate);
      return d !== null && d >= 0 && d <= 7;
    })
    .sort((a, b) => (a.promisedDate ?? "").localeCompare(b.promisedDate ?? ""));

  const byStatus = new Map<string, number>();
  for (const o of open) byStatus.set(o.status, (byStatus.get(o.status) ?? 0) + 1);

  const openTasks = await db
    .select()
    .from(schema.tasks)
    .where(eq(schema.tasks.status, "פתוח"))
    .orderBy(schema.tasks.dueDate);

  const dueTasks = openTasks.filter((t) => {
    const d = inDays(t.dueDate);
    return d === null ? false : d <= 3;
  });

  const stuckAtFactory = await getStuckWorkOrders(10);
  const pipelineValueUsd = decorated.reduce((a, o) => a + o.totalUsd, 0);
  const outstandingUsd = decorated.filter((o) => !o.isSettled).reduce((a, o) => a + o.balanceUsd, 0);
  const outstandingCount = decorated.filter((o) => !o.isSettled && o.balanceUsd > 0.01).length;

  const recent = (await decorateOrders(
    [...allOrders].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 6)
  )) as OrderRow[];

  return {
    settings,
    openCount: open.length,
    late,
    thisWeek,
    byStatus,
    openTasks,
    dueTasks,
    pipelineValueUsd,
    pipelineValueIls: pipelineValueUsd * settings.fxUsdIls,
    outstandingUsd,
    outstandingIls: outstandingUsd * settings.fxUsdIls,
    outstandingCount,
    stuckAtFactory,
    recent,
    customerCount: (await db.select({ n: sql<number>`count(*)` }).from(schema.customers))[0]?.n ?? 0,
  };
}

export async function navCounts() {
  const orders = await db.select({ status: schema.orders.status }).from(schema.orders);
  const openOrders = orders.filter((o) => !CLOSED_STATUSES.has(o.status)).length;
  const customers = await db.select({ n: sql<number>`count(*)` }).from(schema.customers);
  const openTasks = await db
    .select({ n: sql<number>`count(*)` })
    .from(schema.tasks)
    .where(eq(schema.tasks.status, "פתוח"));
  const products = await db.select({ n: sql<number>`count(*)` }).from(schema.products);
  const wos = await db.select({ status: schema.workOrders.status }).from(schema.workOrders);
  return {
    orders: openOrders,
    workOrders: wos.filter((w) => !CLOSED_WO.has(w.status)).length,
    customers: Number(customers[0]?.n ?? 0),
    tasks: Number(openTasks[0]?.n ?? 0),
    catalog: Number(products[0]?.n ?? 0),
  };
}


/* ---------------------------------------------------------------
   קטלוג
   --------------------------------------------------------------- */
export type Product = typeof schema.products.$inferSelect;
export type ProductPhoto = typeof schema.productPhotos.$inferSelect;

/** מזהי תמונות בלבד — לעולם לא שולפים את ה-blob לרשימות. */
async function photoIdsByProduct(productIds: string[]) {
  const map = new Map<string, string[]>();
  if (productIds.length === 0) return map;
  const rows = await db
    .select({
      id: schema.productPhotos.id,
      productId: schema.productPhotos.productId,
      sortOrder: schema.productPhotos.sortOrder,
    })
    .from(schema.productPhotos)
    .orderBy(schema.productPhotos.sortOrder);
  for (const r of rows) {
    if (!productIds.includes(r.productId)) continue;
    const list = map.get(r.productId) ?? [];
    list.push(r.id);
    map.set(r.productId, list);
  }
  return map;
}

export async function listProducts(filter?: { q?: string; category?: string }) {
  const rows = await db.select().from(schema.products).orderBy(desc(schema.products.updatedAt));
  const photos = await photoIdsByProduct(rows.map((r) => r.id));
  const q = filter?.q?.trim().toLowerCase();

  return rows
    .filter((p) => {
      if (filter?.category && filter.category !== "הכל" && p.category !== filter.category)
        return false;
      if (!q) return true;
      return [p.name, p.sku, p.description, p.centerDesc]
        .filter(Boolean)
        .some((f) => String(f).toLowerCase().includes(q));
    })
    .map((p) => ({ ...p, photoIds: photos.get(p.id) ?? [] }));
}

export async function getProduct(id: string) {
  const rows = await db.select().from(schema.products).where(eq(schema.products.id, id)).limit(1);
  const product = rows[0];
  if (!product) return null;
  const photos = await db
    .select({
      id: schema.productPhotos.id,
      bytes: schema.productPhotos.bytes,
      caption: schema.productPhotos.caption,
      sortOrder: schema.productPhotos.sortOrder,
    })
    .from(schema.productPhotos)
    .where(eq(schema.productPhotos.productId, id))
    .orderBy(schema.productPhotos.sortOrder);
  return { product, photos };
}

/** באילו הזמנות הדגם הזה שימש. */
export async function getProductUsage(productId: string) {
  const items = await db
    .select()
    .from(schema.orderItems)
    .where(eq(schema.orderItems.productId, productId));
  if (items.length === 0) return [];
  const allOrders = await db.select().from(schema.orders);
  const customers = await db.select().from(schema.customers);
  const nameById = new Map(customers.map((c) => [c.id, c.name]));
  return items
    .map((i) => {
      const order = allOrders.find((o) => o.id === i.orderId);
      if (!order) return null;
      return {
        orderId: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        customerName: nameById.get(order.customerId) ?? "—",
        createdAt: order.createdAt,
      };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function catalogCount() {
  const rows = await db.select({ n: sql<number>`count(*)` }).from(schema.products);
  return Number(rows[0]?.n ?? 0);
}

/* ---------------------------------------------------------------
   שיתוף — שליפות לעמודים הציבוריים
   --------------------------------------------------------------- */
export async function getPublishedProductBySlug(slug: string) {
  const rows = await db
    .select()
    .from(schema.products)
    .where(eq(schema.products.shareSlug, slug))
    .limit(1);
  const product = rows[0];
  if (!product || !product.isPublished) return null;

  const photos = await db
    .select({ id: schema.productPhotos.id, sortOrder: schema.productPhotos.sortOrder })
    .from(schema.productPhotos)
    .where(eq(schema.productPhotos.productId, product.id))
    .orderBy(schema.productPhotos.sortOrder);

  return { product, photoIds: photos.map((p) => p.id) };
}

export async function getPublishedCollectionBySlug(slug: string) {
  const rows = await db
    .select()
    .from(schema.collections)
    .where(eq(schema.collections.slug, slug))
    .limit(1);
  const collection = rows[0];
  if (!collection || !collection.isPublished) return null;

  const items = await db
    .select()
    .from(schema.collectionItems)
    .where(eq(schema.collectionItems.collectionId, collection.id))
    .orderBy(schema.collectionItems.sortOrder);

  const all = await listProducts();
  const products = items
    .map((i) => {
      const p = all.find((x) => x.id === i.productId);
      return p ? { ...p, note: i.note, itemId: i.id } : null;
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);

  return { collection, products };
}

/** האם התמונה שייכת למוצר מפורסם — משמש להגשה ציבורית. */
export async function isPhotoPublic(photoId: string) {
  const rows = await db
    .select({ productId: schema.productPhotos.productId })
    .from(schema.productPhotos)
    .where(eq(schema.productPhotos.id, photoId))
    .limit(1);
  const productId = rows[0]?.productId;
  if (!productId) return false;
  const product = await db
    .select({ isPublished: schema.products.isPublished })
    .from(schema.products)
    .where(eq(schema.products.id, productId))
    .limit(1);
  return product[0]?.isPublished === true;
}

export type CollectionRow = typeof schema.collections.$inferSelect;

export async function listCollections() {
  const rows = await db
    .select()
    .from(schema.collections)
    .orderBy(desc(schema.collections.updatedAt));
  const items = await db.select().from(schema.collectionItems);
  const customersAll = await db.select().from(schema.customers);
  const nameById = new Map(customersAll.map((c) => [c.id, c.name]));
  return rows.map((c) => ({
    ...c,
    itemCount: items.filter((i) => i.collectionId === c.id).length,
    customerName: c.customerId ? nameById.get(c.customerId) ?? null : null,
  }));
}

export async function getCollection(id: string) {
  const rows = await db
    .select()
    .from(schema.collections)
    .where(eq(schema.collections.id, id))
    .limit(1);
  const collection = rows[0];
  if (!collection) return null;
  const items = await db
    .select()
    .from(schema.collectionItems)
    .where(eq(schema.collectionItems.collectionId, id))
    .orderBy(schema.collectionItems.sortOrder);
  const all = await listProducts();
  const products = items
    .map((i) => {
      const p = all.find((x) => x.id === i.productId);
      return p ? { ...p, itemId: i.id } : null;
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);
  return { collection, products };
}

/* ---------------------------------------------------------------
   גבייה
   --------------------------------------------------------------- */
export async function getReceivables() {
  const all = await listOrders();
  const open = all.filter((o) => !o.isSettled && o.status !== "בוטל" && o.totalUsd > 0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const ageInDays = (iso: string) => {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return 0;
    return Math.max(0, Math.round((today.getTime() - d.getTime()) / 86400000));
  };

  const rows = open
    .map((o) => ({ ...o, ageDays: ageInDays(o.createdAt) }))
    .sort((a, b) => b.ageDays - a.ageDays);

  return {
    rows,
    totalUsd: rows.reduce((a, o) => a + o.balanceUsd, 0),
    totalIls: rows.reduce((a, o) => a + o.balanceIls, 0),
    /** מה שפתוח מעל 30 יום — זה מה שבאמת דורש טלפון */
    overdueUsd: rows.filter((o) => o.ageDays > 30).reduce((a, o) => a + o.balanceUsd, 0),
    overdueCount: rows.filter((o) => o.ageDays > 30).length,
  };
}

/* ---------------------------------------------------------------
   ספקים והזמנות עבודה
   --------------------------------------------------------------- */
export type Supplier = typeof schema.suppliers.$inferSelect;
export type WorkOrder = typeof schema.workOrders.$inferSelect;

export async function listSuppliers() {
  const rows = await db.select().from(schema.suppliers).orderBy(schema.suppliers.name);
  const wos = await db.select().from(schema.workOrders);
  return rows.map((s) => {
    const mine = wos.filter((w) => w.supplierId === s.id);
    return {
      ...s,
      workOrderCount: mine.length,
      openCount: mine.filter((w) => !CLOSED_WO.has(w.status)).length,
    };
  });
}

const CLOSED_WO = new Set<string>(["התקבל אצלי", "נדחה"]);

export async function getSupplier(id: string) {
  const rows = await db.select().from(schema.suppliers).where(eq(schema.suppliers.id, id)).limit(1);
  return rows[0] ?? null;
}

export type WorkOrderRow = WorkOrder & {
  supplierName: string;
  orderNumber: string;
  customerName: string;
  itemName: string | null;
  daysOut: number | null;
  isOpen: boolean;
  wasteG: number;
};

function daysSince(iso: string | null): number | null {
  if (!iso) return null;
  const d = new Date(iso.length === 10 ? iso + "T00:00:00" : iso);
  if (Number.isNaN(d.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.max(0, Math.round((today.getTime() - d.getTime()) / 86400000));
}

async function decorateWorkOrders(rows: WorkOrder[]): Promise<WorkOrderRow[]> {
  if (rows.length === 0) return [];
  const [sups, ords, custs, items] = await Promise.all([
    db.select().from(schema.suppliers),
    db.select().from(schema.orders),
    db.select().from(schema.customers),
    db.select().from(schema.orderItems),
  ]);
  const supById = new Map(sups.map((s) => [s.id, s.name]));
  const custById = new Map(custs.map((c) => [c.id, c.name]));

  return rows.map((w) => {
    const order = ords.find((o) => o.id === w.orderId);
    const item = w.orderItemId ? items.find((i) => i.id === w.orderItemId) : null;
    return {
      ...w,
      supplierName: supById.get(w.supplierId) ?? "—",
      orderNumber: order?.orderNumber ?? "—",
      customerName: order ? custById.get(order.customerId) ?? "—" : "—",
      itemName: item?.name ?? null,
      daysOut: CLOSED_WO.has(w.status) ? null : daysSince(w.sentAt),
      isOpen: !CLOSED_WO.has(w.status),
      wasteG: Math.max(0, w.metalSentG - w.metalReturnedG),
    };
  });
}

export async function listWorkOrders(filter?: { status?: string; supplierId?: string }) {
  const rows = await db.select().from(schema.workOrders).orderBy(desc(schema.workOrders.createdAt));
  const decorated = await decorateWorkOrders(rows);
  return decorated.filter((w) => {
    if (filter?.status === "פתוחות") return w.isOpen;
    if (filter?.status && filter.status !== "הכל" && w.status !== filter.status) return false;
    if (filter?.supplierId && w.supplierId !== filter.supplierId) return false;
    return true;
  });
}

export async function getOrderWorkOrders(orderId: string) {
  const rows = await db
    .select()
    .from(schema.workOrders)
    .where(eq(schema.workOrders.orderId, orderId))
    .orderBy(desc(schema.workOrders.createdAt));
  const decorated = await decorateWorkOrders(rows);
  const updates = await db
    .select()
    .from(schema.workOrderUpdates)
    .orderBy(desc(schema.workOrderUpdates.createdAt));
  const photos = await db
    .select({
      id: schema.workOrderPhotos.id,
      workOrderId: schema.workOrderPhotos.workOrderId,
      author: schema.workOrderPhotos.author,
      bytes: schema.workOrderPhotos.bytes,
    })
    .from(schema.workOrderPhotos);

  return decorated.map((w) => ({
    ...w,
    updates: updates.filter((u) => u.workOrderId === w.id),
    photos: photos.filter((p) => p.workOrderId === w.id),
  }));
}

/** מה שהמפעל רואה. אין כאן לקוח, אין מחיר, אין רווח. */
export async function getFactoryView(token: string) {
  const rows = await db
    .select()
    .from(schema.workOrders)
    .where(eq(schema.workOrders.accessToken, token))
    .limit(1);
  const wo = rows[0];
  if (!wo) return null;

  const [supplier, item, updates, photos, settings] = await Promise.all([
    getSupplier(wo.supplierId),
    wo.orderItemId
      ? db
          .select()
          .from(schema.orderItems)
          .where(eq(schema.orderItems.id, wo.orderItemId))
          .limit(1)
          .then((r) => r[0] ?? null)
      : Promise.resolve(null),
    db
      .select()
      .from(schema.workOrderUpdates)
      .where(eq(schema.workOrderUpdates.workOrderId, wo.id))
      .orderBy(desc(schema.workOrderUpdates.createdAt)),
    db
      .select({
        id: schema.workOrderPhotos.id,
        author: schema.workOrderPhotos.author,
        createdAt: schema.workOrderPhotos.createdAt,
      })
      .from(schema.workOrderPhotos)
      .where(eq(schema.workOrderPhotos.workOrderId, wo.id))
      .orderBy(schema.workOrderPhotos.createdAt),
    getSettings(),
  ]);

  return { workOrder: wo, supplier, item, updates, photos, settings };
}

export async function getWorkOrderPhoto(token: string, photoId: string) {
  const wo = await db
    .select({ id: schema.workOrders.id })
    .from(schema.workOrders)
    .where(eq(schema.workOrders.accessToken, token))
    .limit(1);
  if (!wo[0]) return null;
  const rows = await db
    .select()
    .from(schema.workOrderPhotos)
    .where(eq(schema.workOrderPhotos.id, photoId))
    .limit(1);
  const photo = rows[0];
  if (!photo || photo.workOrderId !== wo[0].id) return null;
  return photo;
}

/** הזמנות עבודה שתקועות במפעל מעל מספר ימים. */
export async function getStuckWorkOrders(thresholdDays = 10) {
  const all = await listWorkOrders({ status: "פתוחות" });
  return all
    .filter((w) => (w.daysOut ?? 0) >= thresholdDays)
    .sort((a, b) => (b.daysOut ?? 0) - (a.daysOut ?? 0));
}
