import { sqliteTable, text, integer, real, blob } from "drizzle-orm/sqlite-core";

const id = () => text("id").primaryKey();
const now = () => text("created_at").notNull().$defaultFn(() => new Date().toISOString());

/* ---------------------------------------------------------------
   משתמשים — כרגע משתמש יחיד, אבל בטבלה כדי לא לשבור לאחר מכן
   --------------------------------------------------------------- */
export const users = sqliteTable("users", {
  id: id(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  passwordHash: text("password_hash").notNull(),
  createdAt: now(),
});

/* ---------------------------------------------------------------
   הגדרות ושערים — שורה יחידה (id = "singleton")
   --------------------------------------------------------------- */
export const settings = sqliteTable("settings", {
  id: text("id").primaryKey(), // תמיד "singleton"
  goldSpotUsdOz: real("gold_spot_usd_oz").notNull().default(0),
  fxUsdIls: real("fx_usd_ils").notNull().default(0),
  vatPct: real("vat_pct").notNull().default(18),
  defaultMultiplier: real("default_multiplier").notNull().default(2),
  defaultDepositPct: real("default_deposit_pct").notNull().default(30),
  /** הקראט שממנו מתחיל כל פריט ודגם חדש */
  defaultKarat: text("default_karat").notNull().default("14K"),
  businessName: text("business_name").notNull().default("Samuel"),

  /** לכפתור הפנייה בעמודי השיתוף */
  whatsappNumber: text("whatsapp_number"),
  instagramHandle: text("instagram_handle"),
  /** כתובת הבסיס שממנה מורכבים לינקי השיתוף */
  publicBaseUrl: text("public_base_url"),

  updatedAt: text("updated_at").notNull().$defaultFn(() => new Date().toISOString()),
});

/** כל עדכון שער נשמר, כדי שאפשר יהיה להסביר רווחיות היסטורית. */
export const rateHistory = sqliteTable("rate_history", {
  id: id(),
  goldSpotUsdOz: real("gold_spot_usd_oz").notNull(),
  fxUsdIls: real("fx_usd_ils").notNull(),
  vatPct: real("vat_pct").notNull(),
  createdAt: now(),
});

/* ---------------------------------------------------------------
   לקוחות
   --------------------------------------------------------------- */
export const customers = sqliteTable("customers", {
  id: id(),
  name: text("name").notNull(),
  type: text("type").notNull().default("פרטי"), // פרטי / חנות / מפיץ
  phone: text("phone"),
  whatsapp: text("whatsapp"),
  email: text("email"),
  instagram: text("instagram"),
  country: text("country").default("ישראל"),
  city: text("city"),
  address: text("address"),
  source: text("source"), // אינסטגרם / המלצה / וואטסאפ / אתר / תערוכה / אחר
  referredBy: text("referred_by"),
  /** ברירת מחדל לדגל הייצוא בהזמנה חדשה של הלקוח */
  defaultExport: integer("default_export", { mode: "boolean" }).notNull().default(false),
  status: text("status").notNull().default("פעיל"),
  notes: text("notes"),
  createdAt: now(),
  updatedAt: text("updated_at").notNull().$defaultFn(() => new Date().toISOString()),
});

/* ---------------------------------------------------------------
   הזמנות
   --------------------------------------------------------------- */
export const orders = sqliteTable("orders", {
  id: id(),
  orderNumber: text("order_number").notNull().unique(),
  customerId: text("customer_id")
    .notNull()
    .references(() => customers.id, { onDelete: "restrict" }),
  type: text("type").notNull().default("בהזמנה"),
  channel: text("channel").notNull().default("וואטסאפ"),
  status: text("status").notNull().default("פנייה"),
  priority: text("priority").notNull().default("רגיל"),

  /** ייצוא מאפס מע"מ אוטומטית — לא סומכים על זיכרון. */
  isExport: integer("is_export", { mode: "boolean" }).notNull().default(false),

  eventDate: text("event_date"),
  promisedDate: text("promised_date"),
  internalDueDate: text("internal_due_date"),
  deliveredAt: text("delivered_at"),

  /** צילום השערים ביום העסקה — אחרת רווחיות היסטורית היא ניחוש. */
  goldSpotSnapshot: real("gold_spot_snapshot").notNull().default(0),
  fxSnapshot: real("fx_snapshot").notNull().default(0),
  vatSnapshot: real("vat_snapshot").notNull().default(0),

  depositPct: real("deposit_pct").notNull().default(30),
  greenInvoiceNumber: text("green_invoice_number"),
  notes: text("notes"),

  /** עמוד הלקוח. הטוקן נוצר בהפעלת הקישור ולא משתנה אחר כך. */
  accessToken: text("access_token").unique(),
  customerLinkEnabled: integer("customer_link_enabled", { mode: "boolean" })
    .notNull()
    .default(false),
  /** אישור העיצוב מגיע מהלקוח דרך העמוד שלו. */
  designApprovedAt: text("design_approved_at"),
  designApprovalNote: text("design_approval_note"),

  createdAt: now(),
  updatedAt: text("updated_at").notNull().$defaultFn(() => new Date().toISOString()),
});

/* ---------------------------------------------------------------
   פריטי הזמנה — כרטיס הפריט של מחשבון "מאזני תמחור", שדה בשדה
   --------------------------------------------------------------- */
export const orderItems = sqliteTable("order_items", {
  id: id(),
  orderId: text("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  sortOrder: integer("sort_order").notNull().default(0),

  name: text("name").notNull().default("פריט"),
  category: text("category").notNull().default("טבעת"),
  notes: text("notes"),

  // --- זהב ---
  karat: text("karat").notNull().default("18K"),
  metalColor: text("metal_color").notNull().default("צהוב"),
  weightG: real("weight_g").notNull().default(0),

  // --- אבן מרכזית ---
  centerStoneType: text("center_stone_type"),
  centerDesc: text("center_desc"),
  centerPricePerCt: real("center_price_per_ct").notNull().default(0),
  centerCaratTotal: real("center_carat_total").notNull().default(0),

  // --- אבני צד ---
  sideStonesOn: integer("side_stones_on", { mode: "boolean" }).notNull().default(false),
  sideStoneType: text("side_stone_type"),
  sideDesc: text("side_desc"),
  sidePricePerCt: real("side_price_per_ct").notNull().default(0),
  sideCaratTotal: real("side_carat_total").notNull().default(0),

  // --- עבודה ---
  modelOn: integer("model_on", { mode: "boolean" }).notNull().default(false),
  modelPrice: real("model_price").notNull().default(0),
  goldsmithCost: real("goldsmith_cost").notNull().default(0),
  centerSettingPrice: real("center_setting_price").notNull().default(0),
  centerSettingQty: real("center_setting_qty").notNull().default(0),
  sideSettingPrice: real("side_setting_price").notNull().default(0),
  sideSettingQty: real("side_setting_qty").notNull().default(0),

  // --- גימור ואריזה ---
  rhodiumCost: real("rhodium_cost").notNull().default(0),
  boxCost: real("box_cost").notNull().default(0),
  bagCost: real("bag_cost").notNull().default(0),
  packagingCost: real("packaging_cost").notNull().default(0),

  // --- מפרט ומכירה ---
  /** הדגם שממנו נטען הפריט, אם נטען מהקטלוג */
  productId: text("product_id"),

  size: text("size"),
  engraving: text("engraving"),
  quantity: integer("quantity").notNull().default(1),
  multiplier: real("multiplier").notNull().default(2),
  /** מחיר ידני שדורס את המכפיל, כשסוגרים מחיר אחר מול הלקוח. */
  priceOverrideUsd: real("price_override_usd"),

  createdAt: now(),
});

/* ---------------------------------------------------------------
   היסטוריית סטטוסים — כדי לדעת כמה זמן באמת לוקח ואיפה נתקעים
   --------------------------------------------------------------- */
export const orderStatusHistory = sqliteTable("order_status_history", {
  id: id(),
  orderId: text("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  fromStatus: text("from_status"),
  toStatus: text("to_status").notNull(),
  note: text("note"),
  createdAt: now(),
});

/* ---------------------------------------------------------------
   יומן אירועים
   --------------------------------------------------------------- */
export const timelineEvents = sqliteTable("timeline_events", {
  id: id(),
  orderId: text("order_id").references(() => orders.id, { onDelete: "cascade" }),
  customerId: text("customer_id").references(() => customers.id, { onDelete: "cascade" }),
  kind: text("kind").notNull().default("הערה"), // שיחה / וואטסאפ / פגישה / הערה / מערכת
  title: text("title").notNull(),
  body: text("body"),
  eventDate: text("event_date"),
  createdAt: now(),
});

/* ---------------------------------------------------------------
   משימות
   --------------------------------------------------------------- */
export const tasks = sqliteTable("tasks", {
  id: id(),
  title: text("title").notNull(),
  notes: text("notes"),
  dueDate: text("due_date"),
  priority: text("priority").notNull().default("רגיל"),
  status: text("status").notNull().default("פתוח"),
  orderId: text("order_id").references(() => orders.id, { onDelete: "cascade" }),
  customerId: text("customer_id").references(() => customers.id, { onDelete: "cascade" }),
  completedAt: text("completed_at"),
  createdAt: now(),
});

/* ---------------------------------------------------------------
   קטלוג דגמים
   הקטלוג נבנה מהעבודה עצמה: כל פריט שתמחרת בהזמנה אפשר לשמור
   כדגם, וכל דגם אפשר לטעון להזמנה חדשה בלחיצה.
   --------------------------------------------------------------- */
export const products = sqliteTable("products", {
  id: id(),
  sku: text("sku").notNull().unique(),
  name: text("name").notNull(),
  category: text("category").notNull().default("טבעת"),
  description: text("description"),

  // --- מפרט ברירת מחדל, לטעינה מהירה להזמנה ---
  karat: text("karat").notNull().default("18K"),
  metalColor: text("metal_color").notNull().default("צהוב"),
  weightG: real("weight_g").notNull().default(0),
  centerStoneType: text("center_stone_type"),
  centerDesc: text("center_desc"),
  centerCaratTotal: real("center_carat_total").notNull().default(0),
  centerPricePerCt: real("center_price_per_ct").notNull().default(0),
  sideStonesOn: integer("side_stones_on", { mode: "boolean" }).notNull().default(false),
  sideStoneType: text("side_stone_type"),
  sideCaratTotal: real("side_carat_total").notNull().default(0),
  sidePricePerCt: real("side_price_per_ct").notNull().default(0),
  goldsmithCost: real("goldsmith_cost").notNull().default(0),
  centerSettingPrice: real("center_setting_price").notNull().default(0),
  centerSettingQty: real("center_setting_qty").notNull().default(0),
  sideSettingPrice: real("side_setting_price").notNull().default(0),
  sideSettingQty: real("side_setting_qty").notNull().default(0),
  rhodiumCost: real("rhodium_cost").notNull().default(0),
  boxCost: real("box_cost").notNull().default(0),
  bagCost: real("bag_cost").notNull().default(0),
  packagingCost: real("packaging_cost").notNull().default(0),

  multiplier: real("multiplier").notNull().default(2),
  /** מחיר קבוע שדורס את המכפיל, אם יש מחירון */
  priceRetailUsd: real("price_retail_usd"),
  priceWholesaleUsd: real("price_wholesale_usd"),

  isAvailable: integer("is_available", { mode: "boolean" }).notNull().default(true),

  /** פרסום לשיתוף — הסלאג נוצר בפרסום ונשאר קבוע כדי שלינקים ישנים לא יישברו. */
  shareSlug: text("share_slug").unique(),
  isPublished: integer("is_published", { mode: "boolean" }).notNull().default(false),
  /** מה רואה הלקוח: מחיר, או "לפנייה" */
  sharePriceMode: text("share_price_mode").notNull().default("מחיר"),

  timesSold: integer("times_sold").notNull().default(0),
  notes: text("notes"),
  createdAt: now(),
  updatedAt: text("updated_at").notNull().$defaultFn(() => new Date().toISOString()),
});

/** התמונות יושבות בתוך אותו קובץ SQLite — גיבוי נשאר קובץ אחד. */
export const productPhotos = sqliteTable("product_photos", {
  id: id(),
  productId: text("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  mime: text("mime").notNull().default("image/jpeg"),
  data: blob("data", { mode: "buffer" }).notNull(),
  width: integer("width").notNull().default(0),
  height: integer("height").notNull().default(0),
  bytes: integer("bytes").notNull().default(0),
  sortOrder: integer("sort_order").notNull().default(0),
  caption: text("caption"),
  createdAt: now(),
});


/* ---------------------------------------------------------------
   קולקציות — מבחר דגמים שנשלח בלינק אחד
   --------------------------------------------------------------- */
export const collections = sqliteTable("collections", {
  id: id(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  subtitle: text("subtitle"),
  intro: text("intro"),
  /** מבחר שהוכן ללקוח מסוים */
  customerId: text("customer_id").references(() => customers.id, { onDelete: "set null" }),
  /** מחיר / סיטונאי / לפנייה */
  priceMode: text("price_mode").notNull().default("מחיר"),
  isPublished: integer("is_published", { mode: "boolean" }).notNull().default(false),
  createdAt: now(),
  updatedAt: text("updated_at").notNull().$defaultFn(() => new Date().toISOString()),
});

export const collectionItems = sqliteTable("collection_items", {
  id: id(),
  collectionId: text("collection_id")
    .notNull()
    .references(() => collections.id, { onDelete: "cascade" }),
  productId: text("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  sortOrder: integer("sort_order").notNull().default(0),
  note: text("note"),
});

/* ---------------------------------------------------------------
   תשלומים
   הסכום נשמר במטבע שבו שולם בפועל, יחד עם השער של אותו יום ועם
   הערך הדולרי — כדי שיתרה לגבייה תישאר נכונה גם אם השער יזוז.
   --------------------------------------------------------------- */
export const payments = sqliteTable("payments", {
  id: id(),
  orderId: text("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  kind: text("kind").notNull().default("מקדמה"), // מקדמה / ביניים / סופי / החזר
  amount: real("amount").notNull().default(0),
  currency: text("currency").notNull().default("ILS"), // ILS / USD
  fxAtPayment: real("fx_at_payment").notNull().default(0),
  /** הערך הדולרי, מחושב פעם אחת בשמירה */
  amountUsd: real("amount_usd").notNull().default(0),
  paidAt: text("paid_at").notNull(),
  method: text("method").notNull().default("העברה"),
  reference: text("reference"),
  greenInvoiceNumber: text("green_invoice_number"),
  notes: text("notes"),
  createdAt: now(),
});

/* ---------------------------------------------------------------
   ספקים ומפעלים — כולם חיצוניים
   --------------------------------------------------------------- */
export const suppliers = sqliteTable("suppliers", {
  id: id(),
  name: text("name").notNull(),
  type: text("type").notNull().default("מפעל ייצור"),
  contactName: text("contact_name"),
  phone: text("phone"),
  whatsapp: text("whatsapp"),
  email: text("email"),
  city: text("city"),
  paymentTerms: text("payment_terms"),
  /** זמן אספקה ממוצע בימים — לתכנון תאריך יעד */
  leadDays: integer("lead_days").notNull().default(0),
  rating: integer("rating").notNull().default(0), // 0–5, פנימי
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  notes: text("notes"),
  createdAt: now(),
  updatedAt: text("updated_at").notNull().$defaultFn(() => new Date().toISOString()),
});

/* ---------------------------------------------------------------
   הזמנות עבודה — הישות שמחזיקה את הייצור מול המפעל
   --------------------------------------------------------------- */
export const workOrders = sqliteTable("work_orders", {
  id: id(),
  woNumber: text("wo_number").notNull().unique(),
  orderId: text("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  orderItemId: text("order_item_id").references(() => orderItems.id, { onDelete: "set null" }),
  supplierId: text("supplier_id")
    .notNull()
    .references(() => suppliers.id, { onDelete: "restrict" }),

  /** מה בדיוק מבקשים: יציקה / שיבוץ / ליטוש / ציפוי / הכל */
  scope: text("scope").notNull().default("ייצור מלא"),
  instructions: text("instructions"),
  status: text("status").notNull().default("נשלח"),

  sentAt: text("sent_at"),
  dueDate: text("due_date"),
  /** התאריך שהמפעל עצמו התחייב לו */
  factoryEta: text("factory_eta"),
  receivedAt: text("received_at"),

  /** מעקב זהב: כמה יצא, כמה חזר. הפחת הוא ההפרש. */
  metalSentG: real("metal_sent_g").notNull().default(0),
  metalReturnedG: real("metal_returned_g").notNull().default(0),

  cost: real("cost").notNull().default(0),
  costCurrency: text("cost_currency").notNull().default("ILS"),

  /** הטוקן שבלינק שנשלח למפעל. נוצר פעם אחת ולא משתנה. */
  accessToken: text("access_token").notNull().unique(),
  notes: text("notes"),
  createdAt: now(),
  updatedAt: text("updated_at").notNull().$defaultFn(() => new Date().toISOString()),
});

/** כל עדכון מהמפעל או ממני, לפי סדר זמנים. */
export const workOrderUpdates = sqliteTable("work_order_updates", {
  id: id(),
  workOrderId: text("work_order_id")
    .notNull()
    .references(() => workOrders.id, { onDelete: "cascade" }),
  /** מי כתב: "מפעל" או "אני" */
  author: text("author").notNull().default("מפעל"),
  status: text("status"),
  eta: text("eta"),
  body: text("body"),
  createdAt: now(),
});

/** תמונות של הזמנת עבודה — סקיצות שאני שולח, והתקדמות שהמפעל מעלה. */
export const workOrderPhotos = sqliteTable("work_order_photos", {
  id: id(),
  workOrderId: text("work_order_id")
    .notNull()
    .references(() => workOrders.id, { onDelete: "cascade" }),
  author: text("author").notNull().default("מפעל"),
  mime: text("mime").notNull().default("image/jpeg"),
  data: blob("data", { mode: "buffer" }).notNull(),
  bytes: integer("bytes").notNull().default(0),
  caption: text("caption"),
  createdAt: now(),
});


/** תמונות עיצוב של ההזמנה — מה שהלקוח רואה בעמוד שלו. */
export const orderPhotos = sqliteTable("order_photos", {
  id: id(),
  orderId: text("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  kind: text("kind").notNull().default("עיצוב"), // עיצוב / מוכן
  mime: text("mime").notNull().default("image/jpeg"),
  data: blob("data", { mode: "buffer" }).notNull(),
  bytes: integer("bytes").notNull().default(0),
  caption: text("caption"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: now(),
});

/* ---------------------------------------------------------------
   הוצאות — מה שלא נספר בעלות של פריט מסוים
   --------------------------------------------------------------- */
export const expenses = sqliteTable("expenses", {
  id: id(),
  spentAt: text("spent_at").notNull(),
  category: text("category").notNull().default("אחר"),
  description: text("description").notNull(),
  amount: real("amount").notNull().default(0),
  currency: text("currency").notNull().default("ILS"),
  fxAtSpend: real("fx_at_spend").notNull().default(0),
  /** הערך הדולרי, מחושב פעם אחת בשמירה — כדי שדוחות יהיו יציבים */
  amountUsd: real("amount_usd").notNull().default(0),
  supplierId: text("supplier_id").references(() => suppliers.id, { onDelete: "set null" }),
  invoiceNumber: text("invoice_number"),
  /** הוצאה קבועה חוזרת, לסימון בלבד */
  isRecurring: integer("is_recurring", { mode: "boolean" }).notNull().default(false),
  notes: text("notes"),
  createdAt: now(),
});
