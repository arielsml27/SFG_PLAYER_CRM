"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  KARATS,
  MULTIPLIER_TIERS,
  costBreakdown,
  goldPerGramUsd,
  fineFor,
  marginPctFromMultiplier,
} from "@/lib/pricing";
import { ITEM_CATEGORIES, METAL_COLORS, STONE_TYPES } from "@/lib/constants";
import { ils, pct, usd } from "@/lib/format";
import { Field, SectionHead } from "@/components/ui";
import type { OrderItem } from "@/lib/data";

/** ערכי פתיחה מדגם בקטלוג, כשמוסיפים פריט מתוך הקטלוג. */
export type ItemSeed = Partial<OrderItem> & { productId?: string };

type Props = {
  orderId: string;
  item?: OrderItem;
  seed?: ItemSeed;
  goldSpotUsdOz: number;
  fx: number;
  defaultMultiplier: number;
  defaultKarat: string;
  action: (fd: FormData) => void;
};

const N = (v: unknown) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

/**
 * כרטיס הפריט — אותם שדות בדיוק כמו במחשבון "מאזני תמחור",
 * עם חישוב חי בזמן ההקלדה. אין הזנה כפולה: מה שמוקלד כאן הוא
 * גם מה שמתמחר וגם מה שנשמר על ההזמנה.
 */
export default function ItemForm({
  orderId,
  item,
  seed,
  goldSpotUsdOz,
  fx,
  defaultMultiplier,
  defaultKarat,
  action,
}: Props) {
  // הפריט הקיים גובר על הדגם; הדגם גובר על ברירות המחדל.
  const base = { ...seed, ...item } as ItemSeed;
  const [f, setF] = useState({
    karat: base.karat ?? defaultKarat,
    weightG: base.weightG ?? 0,
    centerPricePerCt: base.centerPricePerCt ?? 0,
    centerCaratTotal: base.centerCaratTotal ?? 0,
    sideStonesOn: base.sideStonesOn ?? false,
    sidePricePerCt: base.sidePricePerCt ?? 0,
    sideCaratTotal: base.sideCaratTotal ?? 0,
    modelOn: base.modelOn ?? false,
    modelPrice: base.modelPrice ?? 0,
    goldsmithCost: base.goldsmithCost ?? 0,
    centerSettingPrice: base.centerSettingPrice ?? 0,
    centerSettingQty: base.centerSettingQty ?? 0,
    sideSettingPrice: base.sideSettingPrice ?? 0,
    sideSettingQty: base.sideSettingQty ?? 0,
    rhodiumCost: base.rhodiumCost ?? 0,
    boxCost: base.boxCost ?? 0,
    bagCost: base.bagCost ?? 0,
    packagingCost: base.packagingCost ?? 0,
    quantity: base.quantity ?? 1,
    multiplier: base.multiplier ?? defaultMultiplier,
    priceOverrideUsd: base.priceOverrideUsd ?? null,
  });

  const set = (k: keyof typeof f) => (v: unknown) => setF((s) => ({ ...s, [k]: v }));

  const cost = useMemo(() => costBreakdown(f, goldSpotUsdOz), [f, goldSpotUsdOz]);
  const unitPrice =
    f.priceOverrideUsd && f.priceOverrideUsd > 0
      ? f.priceOverrideUsd
      : cost.totalUsd * (N(f.multiplier) || 1);
  const qty = Math.max(1, N(f.quantity) || 1);
  const lineProfit = (unitPrice - cost.totalUsd) * qty;
  const realMargin = unitPrice ? ((unitPrice - cost.totalUsd) / unitPrice) * 100 : 0;

  return (
    <form action={action} className="stack">
      <input type="hidden" name="orderId" value={orderId} />
      {item ? <input type="hidden" name="itemId" value={item.id} /> : null}
      {base.productId ? <input type="hidden" name="productId" value={base.productId} /> : null}

      {/* --- זהות הפריט --- */}
      <div className="panel stack">
        <SectionHead title="הפריט" latin="ITEM" />
        <div className="form-grid">
          <Field label="שם הפריט">
            <input name="name" defaultValue={base.name ?? ""} placeholder="תליון לב · שלוש אבנים" required />
          </Field>
          <Field label="קטגוריה">
            <select name="category" defaultValue={base.category ?? "טבעת"}>
              {ITEM_CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </Field>
          <Field label="מידה / אורך">
            <input name="size" defaultValue={base.size ?? ""} />
          </Field>
          <Field label="חריטה">
            <input name="engraving" defaultValue={base.engraving ?? ""} />
          </Field>
        </div>
      </div>

      {/* --- זהב --- */}
      <div className="panel stack">
        <SectionHead title="זהב" latin="GOLD" />
        <div className="form-grid">
          <Field label="קראט">
            <select name="karat" value={f.karat} onChange={(e) => set("karat")(e.target.value)}>
              {KARATS.map((k) => (
                <option key={k.label}>{k.label}</option>
              ))}
            </select>
          </Field>
          <Field label="גוון">
            <select name="metalColor" defaultValue={base.metalColor ?? "צהוב"}>
              {METAL_COLORS.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </Field>
          <Field
            label="משקל (גרם)"
            hint={`${usd(goldPerGramUsd(fineFor(f.karat), goldSpotUsdOz))} לגרם`}
          >
            <input
              type="number"
              name="weightG"
              step="0.01"
              min="0"
              value={f.weightG}
              onChange={(e) => set("weightG")(N(e.target.value))}
            />
          </Field>
        </div>
      </div>

      {/* --- אבן מרכזית --- */}
      <div className="panel stack">
        <SectionHead title="אבן מרכזית" latin="CENTER STONE" />
        <div className="form-grid">
          <Field label="סוג">
            <select name="centerStoneType" defaultValue={base.centerStoneType ?? ""}>
              <option value="">—</option>
              {STONE_TYPES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </Field>
          <Field label="מחיר לקראט ($)">
            <input
              type="number"
              name="centerPricePerCt"
              step="0.01"
              min="0"
              value={f.centerPricePerCt}
              onChange={(e) => set("centerPricePerCt")(N(e.target.value))}
            />
          </Field>
          <Field label="משקל כולל (קראט)">
            <input
              type="number"
              name="centerCaratTotal"
              step="0.01"
              min="0"
              value={f.centerCaratTotal}
              onChange={(e) => set("centerCaratTotal")(N(e.target.value))}
            />
          </Field>
          <Field label="חיתוך" hint="מופיע בהצעת המחיר">
            <input name="centerCut" defaultValue={base.centerCut ?? ""} placeholder="Round Brilliant" />
          </Field>
          <Field label="צבע">
            <input name="centerColor" defaultValue={base.centerColor ?? ""} placeholder="D – F" dir="ltr" />
          </Field>
          <Field label="ניקיון">
            <input name="centerClarity" defaultValue={base.centerClarity ?? ""} placeholder="VS" dir="ltr" />
          </Field>
          <Field label="תיאור נוסף" hint="תעודה, הערות">
            <input name="centerDesc" defaultValue={base.centerDesc ?? ""} />
          </Field>
        </div>
        <div className="form-grid">
          <Field label="שיבוץ — מחיר לאבן ($)">
            <input
              type="number"
              name="centerSettingPrice"
              step="0.01"
              min="0"
              value={f.centerSettingPrice}
              onChange={(e) => set("centerSettingPrice")(N(e.target.value))}
            />
          </Field>
          <Field label="כמות אבנים">
            <input
              type="number"
              name="centerSettingQty"
              step="1"
              min="0"
              value={f.centerSettingQty}
              onChange={(e) => set("centerSettingQty")(N(e.target.value))}
            />
          </Field>
        </div>
      </div>

      {/* --- אבני צד --- */}
      <div className="panel stack">
        <div className="row" style={{ justifyContent: "space-between" }}>
          <SectionHead title="אבני צד" latin="SIDE STONES" />
          <label className="switch">
            <input
              type="checkbox"
              name="sideStonesOn"
              checked={f.sideStonesOn}
              onChange={(e) => set("sideStonesOn")(e.target.checked)}
            />
            כלול
          </label>
        </div>
        <fieldset
          className={f.sideStonesOn ? undefined : "off"}
          disabled={!f.sideStonesOn}
          style={{ border: 0, padding: 0, margin: 0 }}
        >
          <div className="form-grid">
            <Field label="סוג">
              <select name="sideStoneType" defaultValue={base.sideStoneType ?? ""}>
                <option value="">—</option>
                {STONE_TYPES.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </Field>
            <Field label="מחיר לקראט ($)">
              <input
                type="number"
                name="sidePricePerCt"
                step="0.01"
                min="0"
                value={f.sidePricePerCt}
                onChange={(e) => set("sidePricePerCt")(N(e.target.value))}
              />
            </Field>
            <Field label="משקל כולל (קראט)">
              <input
                type="number"
                name="sideCaratTotal"
                step="0.01"
                min="0"
                value={f.sideCaratTotal}
                onChange={(e) => set("sideCaratTotal")(N(e.target.value))}
              />
            </Field>
            <Field label="תיאור">
              <input name="sideDesc" defaultValue={base.sideDesc ?? ""} />
            </Field>
            <Field label="שיבוץ — מחיר לאבן ($)">
              <input
                type="number"
                name="sideSettingPrice"
                step="0.01"
                min="0"
                value={f.sideSettingPrice}
                onChange={(e) => set("sideSettingPrice")(N(e.target.value))}
              />
            </Field>
            <Field label="כמות אבנים">
              <input
                type="number"
                name="sideSettingQty"
                step="1"
                min="0"
                value={f.sideSettingQty}
                onChange={(e) => set("sideSettingQty")(N(e.target.value))}
              />
            </Field>
          </div>
        </fieldset>
      </div>

      {/* --- עבודה, גימור ואריזה --- */}
      <div className="panel stack">
        <SectionHead title="עבודה וגימור" latin="LABOUR & FINISH" />
        <div className="row" style={{ justifyContent: "flex-start" }}>
          <label className="switch">
            <input
              type="checkbox"
              name="modelOn"
              checked={f.modelOn}
              onChange={(e) => set("modelOn")(e.target.checked)}
            />
            יש עלות מודל
          </label>
        </div>
        <div className="form-grid">
          <Field label="מחיר מודל ($)">
            <input
              type="number"
              name="modelPrice"
              step="0.01"
              min="0"
              disabled={!f.modelOn}
              value={f.modelPrice}
              onChange={(e) => set("modelPrice")(N(e.target.value))}
            />
          </Field>
          <Field label="עבודת צורף ($)">
            <input
              type="number"
              name="goldsmithCost"
              step="0.01"
              min="0"
              value={f.goldsmithCost}
              onChange={(e) => set("goldsmithCost")(N(e.target.value))}
            />
          </Field>
          <Field label="גימור רודיום ($)">
            <input
              type="number"
              name="rhodiumCost"
              step="0.01"
              min="0"
              value={f.rhodiumCost}
              onChange={(e) => set("rhodiumCost")(N(e.target.value))}
            />
          </Field>
          <Field label="קופסא ($)">
            <input
              type="number"
              name="boxCost"
              step="0.01"
              min="0"
              value={f.boxCost}
              onChange={(e) => set("boxCost")(N(e.target.value))}
            />
          </Field>
          <Field label="שקית ($)">
            <input
              type="number"
              name="bagCost"
              step="0.01"
              min="0"
              value={f.bagCost}
              onChange={(e) => set("bagCost")(N(e.target.value))}
            />
          </Field>
          <Field label="אריזה ($)">
            <input
              type="number"
              name="packagingCost"
              step="0.01"
              min="0"
              value={f.packagingCost}
              onChange={(e) => set("packagingCost")(N(e.target.value))}
            />
          </Field>
        </div>
      </div>

      {/* --- תמחור חי --- */}
      <div className="panel panel-accent stack">
        <SectionHead title="תמחור" latin="PRICING" />

        <div className="spec">
          <Row k="זהב" v={cost.gold} />
          <Row k="אבן מרכזית" v={cost.centerStone} />
          {f.sideStonesOn ? <Row k="אבני צד" v={cost.sideStone} /> : null}
          {f.modelOn ? <Row k="מודל" v={cost.model} /> : null}
          <Row k="עבודת צורף" v={cost.goldsmith} />
          <Row k="שיבוץ" v={cost.centerSetting + cost.sideSetting} />
          <Row k="גימור ואריזה" v={cost.finishing} />
        </div>

        <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-end" }}>
          <div>
            <div className="micro">עלות ליחידה</div>
            <div className="figure-sm num">{usd(cost.totalUsd)}</div>
            <div className="quiet num" style={{ fontSize: 12 }}>
              {ils(cost.totalUsd * fx)}
            </div>
          </div>
          <div style={{ textAlign: "start" }}>
            <div className="micro">מחיר ליחידה (לפני מע״מ)</div>
            <div className="figure num">{usd(unitPrice)}</div>
            <div className="quiet num" style={{ fontSize: 12 }}>
              {ils(unitPrice * fx)}
            </div>
          </div>
        </div>

        <div className="form-grid">
          <Field
            label="מכפיל"
            hint={`רווח בפועל ${pct(marginPctFromMultiplier(N(f.multiplier)))} ממחיר המכירה`}
          >
            <select
              name="multiplier"
              value={String(f.multiplier)}
              onChange={(e) => set("multiplier")(N(e.target.value))}
            >
              {MULTIPLIER_TIERS.map((m) => (
                <option key={m} value={m}>
                  ×{m} — רווח {pct(marginPctFromMultiplier(m), 0)}
                </option>
              ))}
              {MULTIPLIER_TIERS.includes(f.multiplier as never) ? null : (
                <option value={f.multiplier}>×{f.multiplier}</option>
              )}
            </select>
          </Field>
          <Field label="כמות">
            <input
              type="number"
              name="quantity"
              step="1"
              min="1"
              value={f.quantity}
              onChange={(e) => set("quantity")(N(e.target.value))}
            />
          </Field>
          <Field label="מחיר ידני ($)" hint="דורס את המכפיל. השאר ריק כדי להשתמש במכפיל.">
            <input
              type="number"
              name="priceOverrideUsd"
              step="0.01"
              min="0"
              value={f.priceOverrideUsd ?? ""}
              onChange={(e) =>
                set("priceOverrideUsd")(e.target.value === "" ? null : N(e.target.value))
              }
            />
          </Field>
        </div>

        <hr className="hairline" style={{ margin: "4px 0" }} />

        <div className="row" style={{ justifyContent: "space-between" }}>
          <span className="micro">רווח על השורה ({qty} יח׳)</span>
          <span className={`num ${lineProfit >= 0 ? "good" : "danger"}`} style={{ fontSize: 17 }}>
            {usd(lineProfit)} · {pct(realMargin)}
          </span>
        </div>
        {goldSpotUsdOz === 0 ? (
          <p className="warn" style={{ fontSize: 12.5 }}>
            שער הזהב על ההזמנה הזו הוא 0 — עלות הזהב לא נספרת. עדכן שערים בהגדרות ורענן את שערי ההזמנה.
          </p>
        ) : null}
      </div>

      <div className="panel stack">
        <Field label="הערות לפריט">
          <textarea name="notes" defaultValue={base.notes ?? ""} />
        </Field>
      </div>

      <div className="row">
        <button type="submit" className="btn btn-primary">
          {item ? "שמור שינויים" : "הוסף פריט"}
        </button>
        <Link href={`/orders/${orderId}?tab=items`} className="btn btn-ghost">
          ביטול
        </Link>
      </div>
    </form>
  );

  function Row({ k, v }: { k: string; v: number }) {
    return (
      <div className="spec-row">
        <span className="k">{k}</span>
        <span className="v num">{usd(v)}</span>
      </div>
    );
  }
}
