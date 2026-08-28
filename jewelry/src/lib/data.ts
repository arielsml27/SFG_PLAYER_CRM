import { and, desc, eq, inArray, isNull, or, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { CLOSED_STATUSES } from "./constants";
import { orderTotals, priceItem, type ItemPricing } from "./pricing";

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

  return rows.map((o) => {
    const mine = items.filter((i) => i.orderId === o.id);
    const lines = mine.map((i) => priceItem(i, o.goldSpotSnapshot));
    const totals = orderTotals(lines, {
      isExport: o.isExport,
      vatPct: o.vatSnapshot,
      fx: o.fxSnapshot,
      depositPct: o.depositPct,
    });
    return {
      ...o,
      customerName: nameById.get(o.customerId) ?? "—",
      itemCount: mine.length,
      totalUsd: totals.totalUsd,
      totalIls: totals.totalIls,
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
};

export async function getOrder(id: string): Promise<FullOrder | null> {
  const rows = await db.select().from(schema.orders).where(eq(schema.orders.id, id)).limit(1);
  const order = rows[0];
  if (!order) return null;

  const [customer, items, history, timeline, orderTasks] = await Promise.all([
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
  ]);

  const lines = items.map((i) => priceItem(i, order.goldSpotSnapshot));
  const totals = orderTotals(lines, {
    isExport: order.isExport,
    vatPct: order.vatSnapshot,
    fx: order.fxSnapshot,
    depositPct: order.depositPct,
  });

  return { order, customer, items, lines, totals, history, timeline, tasks: orderTasks };
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

  const pipelineValueUsd = decorated.reduce((a, o) => a + o.totalUsd, 0);

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
  return {
    orders: openOrders,
    customers: Number(customers[0]?.n ?? 0),
    tasks: Number(openTasks[0]?.n ?? 0),
  };
}

export { and, or, isNull };
