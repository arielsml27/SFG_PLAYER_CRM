"use client";

import { useState } from "react";
import { Link2, Check, Plus, Power } from "lucide-react";
import { createRequestLink, setRequestLinkActive } from "@/lib/request-link-actions";

type LinkRow = { id: string; token: string; contactName: string | null; active: boolean; createdAt: string };
type ContactOption = { id: string; name: string; role: string | null };

function CopyUrlButton({ path }: { path: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    const url = `${window.location.origin}${path}`;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      try {
        window.prompt("העתק את הלינק:", url);
      } catch {
        /* nothing else to do */
      }
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  return (
    <button type="button" onClick={copy} className="btn btn-outline btn-sm shrink-0">
      {copied ? <Check size={13} /> : <Link2 size={13} />}
      {copied ? "הועתק" : "העתק לינק"}
    </button>
  );
}

// "צור לינק בקשה": creates public /request/<token> links for a club (optionally
// pinned to one contact) or generic links when clubId is null, and lists the
// existing ones with copy + activate/deactivate.
export default function RequestLinkPanel({
  clubId,
  contacts,
  links,
}: {
  clubId: string | null;
  contacts: ContactOption[];
  links: LinkRow[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="text-xs" style={{ color: "var(--muted)" }}>
          {clubId
            ? "לינק לטופס בקשת שחקן שהמאמן או המנהל המקצועי ממלא ב-20 שניות. כל שליחה נכנסת כבקשה למועדון הזה."
            : "לינק כללי (ללא מועדון): ממלא הטופס מקליד את שם המועדון בעצמו."}
        </div>
        <button type="button" className="btn btn-gold btn-sm" onClick={() => setOpen((o) => !o)}>
          <Plus size={13} />
          צור לינק בקשה
        </button>
      </div>

      {open && (
        <form
          action={async (fd) => {
            await createRequestLink(fd);
            setOpen(false);
          }}
          className="grid grid-cols-1 md:grid-cols-3 gap-2 border rounded-lg p-3"
          style={{ borderColor: "var(--border)" }}
        >
          {clubId && <input type="hidden" name="clubId" value={clubId} />}
          {clubId && contacts.length > 0 ? (
            <div>
              <label className="field-label">איש קשר (אופציונלי)</label>
              <select name="contactId" className="input" defaultValue="">
                <option value="">ללא, הממלא יקליד את פרטיו</option>
                {contacts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                    {c.role ? ` · ${c.role}` : ""}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div>
              <label className="field-label">שם למי הלינק (אופציונלי)</label>
              <input name="contactName" className="input" placeholder="למשל: יוסי, מאמן" />
            </div>
          )}
          <div className="md:col-span-2 flex items-end">
            <button type="submit" className="btn btn-gold btn-sm">
              צור
            </button>
          </div>
        </form>
      )}

      {links.length > 0 && (
        <div className="space-y-2">
          {links.map((l) => {
            const path = `/request/${l.token}`;
            return (
              <div
                key={l.id}
                className="flex items-center justify-between gap-3 border-b pb-2 text-sm flex-wrap"
                style={{ borderColor: "var(--border)", opacity: l.active ? 1 : 0.55 }}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{l.contactName || "לינק כללי"}</span>
                    <span className={`badge ${l.active ? "badge-ok" : "badge-neutral"}`}>{l.active ? "פעיל" : "כבוי"}</span>
                  </div>
                  <code className="text-xs block truncate max-w-[60vw] md:max-w-md" dir="ltr" style={{ color: "var(--muted)" }}>
                    {path}
                  </code>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <CopyUrlButton path={path} />
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    title={l.active ? "כבה לינק" : "הפעל לינק"}
                    onClick={() => setRequestLinkActive(l.id, !l.active)}
                  >
                    <Power size={13} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
