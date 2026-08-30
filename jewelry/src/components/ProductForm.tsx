import Link from "next/link";
import { ITEM_CATEGORIES, METAL_COLORS, STONE_TYPES } from "@/lib/constants";
import { KARATS, MULTIPLIER_TIERS, marginPctFromMultiplier } from "@/lib/pricing";
import { pct } from "@/lib/format";
import { Field, SectionHead } from "@/components/ui";
import PhotoPicker from "@/components/PhotoPicker";
import type { Product } from "@/lib/data";

export default function ProductForm({
  product,
  action,
  submitLabel,
  defaultKarat,
}: {
  product?: Product;
  action: (fd: FormData) => void;
  submitLabel: string;
  defaultKarat: string;
}) {
  return (
    <form action={action} className="stack">
      {product ? <input type="hidden" name="id" value={product.id} /> : null}

      <div className="panel stack">
        <SectionHead title="הדגם" latin="MODEL" />
        <div className="form-grid">
          <Field label="שם הדגם">
            <input name="name" defaultValue={product?.name ?? ""} required autoFocus />
          </Field>
          <Field label="קטגוריה">
            <select name="category" defaultValue={product?.category ?? "טבעת"}>
              {ITEM_CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </Field>
          <Field label="מק״ט" hint={product ? undefined : "יינתן אוטומטית אם תשאיר ריק"}>
            <input name="sku" defaultValue={product?.sku ?? ""} dir="ltr" />
          </Field>
        </div>
        <Field label="תיאור" hint="הטקסט שיישלח ללקוח יחד עם התמונות">
          <textarea name="description" defaultValue={product?.description ?? ""} />
        </Field>
        <label className="switch">
          <input type="checkbox" name="isAvailable" defaultChecked={product?.isAvailable ?? true} />
          זמין להזמנה
        </label>
      </div>

      <div className="panel stack">
        <SectionHead title="תמונות" latin="PHOTOS" />
        <PhotoPicker
          hint={
            product
              ? "התמונות שתבחר יתווספו לגלריה של הדגם בשמירה."
              : "אפשר להעלות תמונות כאן ולשמור הכל יחד — אין צורך לשמור קודם ולחזור."
          }
        />
      </div>

      <div className="panel stack">
        <SectionHead title="מפרט ברירת מחדל" latin="DEFAULT SPEC" />
        <p className="quiet" style={{ fontSize: 12.5 }}>
          זה מה שייטען אוטומטית כשתוסיף את הדגם להזמנה. תמיד אפשר לשנות שם.
        </p>
        <div className="form-grid">
          <Field label="קראט">
            <select name="karat" defaultValue={product?.karat ?? defaultKarat}>
              {KARATS.map((k) => (
                <option key={k.label}>{k.label}</option>
              ))}
            </select>
          </Field>
          <Field label="גוון">
            <select name="metalColor" defaultValue={product?.metalColor ?? "צהוב"}>
              {METAL_COLORS.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </Field>
          <Field label="משקל זהב (גרם)">
            <input type="number" name="weightG" step="0.01" min="0" defaultValue={product?.weightG ?? 0} />
          </Field>
          <Field label="אבן מרכזית">
            <select name="centerStoneType" defaultValue={product?.centerStoneType ?? ""}>
              <option value="">—</option>
              {STONE_TYPES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </Field>
          <Field label="מחיר לקראט ($)">
            <input type="number" name="centerPricePerCt" step="0.01" min="0" defaultValue={product?.centerPricePerCt ?? 0} />
          </Field>
          <Field label="קראט מרכזית">
            <input type="number" name="centerCaratTotal" step="0.01" min="0" defaultValue={product?.centerCaratTotal ?? 0} />
          </Field>
          <Field label="חיתוך">
            <input name="centerCut" defaultValue={product?.centerCut ?? ""} placeholder="Round Brilliant" />
          </Field>
          <Field label="צבע">
            <input name="centerColor" defaultValue={product?.centerColor ?? ""} placeholder="D – F" dir="ltr" />
          </Field>
          <Field label="ניקיון">
            <input name="centerClarity" defaultValue={product?.centerClarity ?? ""} placeholder="VS" dir="ltr" />
          </Field>
          <Field label="תיאור אבן">
            <input name="centerDesc" defaultValue={product?.centerDesc ?? ""} />
          </Field>
        </div>

        <label className="switch">
          <input type="checkbox" name="sideStonesOn" defaultChecked={product?.sideStonesOn ?? false} />
          יש אבני צד
        </label>
        <div className="form-grid">
          <Field label="סוג אבני צד">
            <select name="sideStoneType" defaultValue={product?.sideStoneType ?? ""}>
              <option value="">—</option>
              {STONE_TYPES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </Field>
          <Field label="מחיר לקראט ($)">
            <input type="number" name="sidePricePerCt" step="0.01" min="0" defaultValue={product?.sidePricePerCt ?? 0} />
          </Field>
          <Field label="קראט צד">
            <input type="number" name="sideCaratTotal" step="0.01" min="0" defaultValue={product?.sideCaratTotal ?? 0} />
          </Field>
        </div>
      </div>

      <div className="panel stack">
        <SectionHead title="עבודה וגימור" latin="LABOUR" />
        <div className="form-grid">
          <Field label="עבודת צורף ($)">
            <input type="number" name="goldsmithCost" step="0.01" min="0" defaultValue={product?.goldsmithCost ?? 0} />
          </Field>
          <Field label="שיבוץ מרכזית — לאבן ($)">
            <input type="number" name="centerSettingPrice" step="0.01" min="0" defaultValue={product?.centerSettingPrice ?? 0} />
          </Field>
          <Field label="כמות">
            <input type="number" name="centerSettingQty" step="1" min="0" defaultValue={product?.centerSettingQty ?? 0} />
          </Field>
          <Field label="שיבוץ צד — לאבן ($)">
            <input type="number" name="sideSettingPrice" step="0.01" min="0" defaultValue={product?.sideSettingPrice ?? 0} />
          </Field>
          <Field label="כמות">
            <input type="number" name="sideSettingQty" step="1" min="0" defaultValue={product?.sideSettingQty ?? 0} />
          </Field>
          <Field label="רודיום ($)">
            <input type="number" name="rhodiumCost" step="0.01" min="0" defaultValue={product?.rhodiumCost ?? 0} />
          </Field>
          <Field label="קופסא ($)">
            <input type="number" name="boxCost" step="0.01" min="0" defaultValue={product?.boxCost ?? 0} />
          </Field>
          <Field label="שקית ($)">
            <input type="number" name="bagCost" step="0.01" min="0" defaultValue={product?.bagCost ?? 0} />
          </Field>
          <Field label="אריזה ($)">
            <input type="number" name="packagingCost" step="0.01" min="0" defaultValue={product?.packagingCost ?? 0} />
          </Field>
        </div>
      </div>

      <div className="panel stack">
        <SectionHead title="מחיר" latin="PRICE" />
        <div className="form-grid">
          <Field label="מכפיל ברירת מחדל">
            <select name="multiplier" defaultValue={String(product?.multiplier ?? 2)}>
              {MULTIPLIER_TIERS.map((m) => (
                <option key={m} value={m}>
                  ×{m} — רווח {pct(marginPctFromMultiplier(m), 0)}
                </option>
              ))}
            </select>
          </Field>
          <Field label="מחיר קמעונאי קבוע ($)" hint="ריק = לפי המכפיל ושערי היום">
            <input type="number" name="priceRetailUsd" step="0.01" min="0" defaultValue={product?.priceRetailUsd ?? ""} />
          </Field>
          <Field label="מחיר סיטונאי ($)">
            <input type="number" name="priceWholesaleUsd" step="0.01" min="0" defaultValue={product?.priceWholesaleUsd ?? ""} />
          </Field>
        </div>
        <Field label="הערות פנימיות">
          <textarea name="notes" defaultValue={product?.notes ?? ""} />
        </Field>
      </div>

      <div className="row">
        <button type="submit" className="btn btn-primary">
          {submitLabel}
        </button>
        <Link href="/catalog" className="btn btn-ghost">
          ביטול
        </Link>
      </div>
    </form>
  );
}
