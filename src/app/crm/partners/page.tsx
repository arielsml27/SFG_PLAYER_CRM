import Link from "next/link";
import { getPartners } from "@/lib/data";
import { deletePartner } from "@/lib/partner-actions";
import ConfirmSubmitButton from "@/components/ConfirmSubmitButton";
import { Plus, Trash2, Pencil, MessageCircle, ShieldCheck } from "lucide-react";

export const dynamic = "force-dynamic";

function waLink(phone: string): string {
  let digits = phone.replace(/\D/g, "");
  if (digits.startsWith("0")) digits = "972" + digits.slice(1);
  return `https://wa.me/${digits}`;
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-3 border-b pb-1" style={{ borderColor: "var(--border)" }}>
      <dt style={{ color: "var(--muted)" }}>{label}</dt>
      <dd className="font-medium">{children}</dd>
    </div>
  );
}

export default async function PartnersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; trusted?: string }>;
}) {
  const { q, trusted } = await searchParams;
  const trustedOnly = trusted === "1";
  const partnersList = await getPartners({ q, trustedOnly });

  return (
    <div className="max-w-5xl space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">שותפים ואנשי קשר</h1>
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            {partnersList.length} אנשי קשר
          </p>
        </div>
        <Link href="/crm/partners/new" className="btn btn-gold">
          <Plus size={16} />
          איש קשר חדש
        </Link>
      </div>

      <form method="get" className="card p-4 flex items-end gap-3 flex-wrap">
        <div className="flex-1 min-w-[12rem]">
          <label className="field-label">חיפוש</label>
          <input
            name="q"
            defaultValue={q ?? ""}
            placeholder="שם, ארגון או מדינה"
            className="input"
          />
        </div>
        <div>
          <label className="field-label">סינון</label>
          <select name="trusted" defaultValue={trustedOnly ? "1" : ""} className="input">
            <option value="">הכל</option>
            <option value="1">אמינים בלבד</option>
          </select>
        </div>
        <button type="submit" className="btn btn-gold btn-sm">
          חפש
        </button>
        {(q || trustedOnly) && (
          <Link href="/crm/partners" className="btn btn-outline btn-sm">
            נקה
          </Link>
        )}
      </form>

      <div className="space-y-3">
        {partnersList.map((p) => (
          <div key={p.id} className="card p-4">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <div className="font-semibold">{p.name}</div>
                <div className="text-xs" style={{ color: "var(--muted)" }}>
                  {[p.role, p.organization].filter(Boolean).join(" · ") || "—"}
                </div>
              </div>
              {p.trusted && (
                <span className="badge badge-ok">
                  <ShieldCheck size={13} />
                  אמין
                </span>
              )}
            </div>

            <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 text-sm mt-3">
              <Row label="ארגון">{p.organization ?? "—"}</Row>
              <Row label="תפקיד">{p.role ?? "—"}</Row>
              <Row label="מדינה">{p.country ?? "—"}</Row>
              <Row label="עיר">{p.city ?? "—"}</Row>
              <Row label="טלפון">
                {p.phone ? <span dir="ltr">{p.phone}</span> : "—"}
              </Row>
              <Row label="וואטסאפ">
                {p.whatsapp ? (
                  <a
                    href={waLink(p.whatsapp)}
                    target="_blank"
                    rel="noopener noreferrer"
                    dir="ltr"
                    className="inline-flex items-center gap-1 hover:underline"
                    style={{ color: "var(--gold)" }}
                  >
                    <MessageCircle size={13} />
                    {p.whatsapp}
                  </a>
                ) : (
                  "—"
                )}
              </Row>
              <Row label="אימייל">
                {p.email ? (
                  <a href={`mailto:${p.email}`} dir="ltr" className="hover:underline" style={{ color: "var(--gold)" }}>
                    {p.email}
                  </a>
                ) : (
                  "—"
                )}
              </Row>
              <div className="flex justify-between gap-3 border-b pb-1 md:col-span-2" style={{ borderColor: "var(--border)" }}>
                <dt style={{ color: "var(--muted)" }}>הערות</dt>
                <dd className="font-medium whitespace-pre-wrap text-right">{p.notes ?? "—"}</dd>
              </div>
            </dl>

            <div className="flex items-center justify-between mt-3">
              <Link
                href={`/crm/partners/${p.id}`}
                className="inline-flex items-center gap-1 text-sm hover:underline"
                style={{ color: "var(--gold)" }}
              >
                <Pencil size={13} />
                עריכה
              </Link>
              <form action={deletePartner.bind(null, p.id)}>
                <ConfirmSubmitButton confirmMessage={`למחוק את ${p.name}?`} className="btn btn-outline btn-sm">
                  <Trash2 size={13} />
                  מחיקה
                </ConfirmSubmitButton>
              </form>
            </div>
          </div>
        ))}
        {partnersList.length === 0 && (
          <div className="card p-8 text-center text-sm" style={{ color: "var(--muted)" }}>
            אין אנשי קשר להצגה
          </div>
        )}
      </div>
    </div>
  );
}
