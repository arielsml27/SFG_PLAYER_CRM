"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import "./vera-proposal.css";
import {
  DEFAULT_CONTACT,
  LANG_NAMES,
  NEGOTIABLE,
  PROPOSAL_LANGS,
  PROPOSAL_UI,
  TRANSFER_OPTIONS,
  type HiveAxis,
  type Localized,
  type ProposalFact,
  type ProposalLang,
  type ProposalLink,
} from "@/lib/proposal";
import { translateProposalTexts, type ProposalTexts } from "@/lib/proposal-actions";

type Props = {
  playerId: string;
  name: Localized;
  dataline: string[];
  facts: ProposalFact[];
  hive: HiveAxis[];
  links: ProposalLink[];
  defaultLinks: string[];
  qr: Record<string, string>;
  photoUrl: string | null;
  initial: { summary: string; why: string[]; status: string; availability: string; transfer: string };
  today: string;
};

type Terms = { transfer: string; amount: string; salary: string };
type Contact = { name: string; phone: string; email: string };
type Saved = { texts: Record<ProposalLang, ProposalTexts>; names: Localized; terms: Terms; preparedFor: string; selected: string[] };

const STORE_KEY = (id: string) => `vera-proposal:${id}`;
const CONTACT_KEY = "vera-proposal:contact";

function seedTexts(props: Props): Record<ProposalLang, ProposalTexts> {
  const out = {} as Record<ProposalLang, ProposalTexts>;
  for (const lang of PROPOSAL_LANGS) {
    const facts: Record<string, string> = {};
    for (const f of props.facts) facts[f.id] = f.value[lang] ?? (lang === "he" ? "" : "");
    out[lang] =
      lang === "he"
        ? { summary: props.initial.summary, why: props.initial.why, status: props.initial.status, availability: props.initial.availability, facts }
        : { summary: "", why: ["", "", ""], status: "", availability: "", facts };
  }
  return out;
}

function readJson<T>(key: string): T | null {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function writeJson(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable: the editor still works for this session */
  }
}

export default function VeraProposal(props: Props) {
  const [lang, setLang] = useState<ProposalLang>("he");
  const [texts, setTexts] = useState<Record<ProposalLang, ProposalTexts>>(() => seedTexts(props));
  const [names, setNames] = useState<Localized>(props.name);
  const [terms, setTerms] = useState<Terms>({ transfer: props.initial.transfer, amount: "", salary: "" });
  const [preparedFor, setPreparedFor] = useState("");
  const [selected, setSelected] = useState<string[]>(props.defaultLinks);
  const [contact, setContact] = useState<Contact>({ name: DEFAULT_CONTACT.name, phone: DEFAULT_CONTACT.phone, email: DEFAULT_CONTACT.email });
  const [overflow, setOverflow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [loaded, setLoaded] = useState(false);

  const sheetRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  // Restore this player's last edits and the agency contact once, after mount.
  useEffect(() => {
    const saved = readJson<Saved>(STORE_KEY(props.playerId));
    const savedContact = readJson<Contact>(CONTACT_KEY);
    queueMicrotask(() => {
      if (saved) {
        setTexts((t) => ({ ...t, ...saved.texts }));
        if (saved.names) setNames((n) => ({ ...n, ...saved.names }));
        if (saved.terms) setTerms(saved.terms);
        if (typeof saved.preparedFor === "string") setPreparedFor(saved.preparedFor);
        if (Array.isArray(saved.selected)) setSelected(saved.selected);
      }
      if (savedContact) setContact(savedContact);
      setLoaded(true);
    });
  }, [props.playerId]);

  useEffect(() => {
    if (!loaded) return;
    writeJson(STORE_KEY(props.playerId), { texts, names, terms, preparedFor, selected } satisfies Saved);
  }, [loaded, props.playerId, texts, names, terms, preparedFor, selected]);

  useEffect(() => {
    if (loaded) writeJson(CONTACT_KEY, contact);
  }, [loaded, contact]);

  // Fit the A4 preview to the screen width and flag copy that runs past one page.
  useEffect(() => {
    const stage = stageRef.current;
    const sheet = sheetRef.current;
    if (!stage || !sheet) return;
    const ro = new ResizeObserver(() => {
      const scale = Math.min(1, (stage.clientWidth - 2) / 794);
      stage.style.setProperty("--vp-scale", String(scale));
      setOverflow(sheet.scrollHeight - sheet.clientHeight > 1);
    });
    ro.observe(stage);
    ro.observe(sheet);
    for (const child of Array.from(sheet.children)) ro.observe(child);
    return () => ro.disconnect();
  }, [lang]);

  const t = texts[lang];
  const u = PROPOSAL_UI[lang];
  const rtl = lang === "he";

  function patch(update: Partial<ProposalTexts>) {
    setTexts((all) => ({ ...all, [lang]: { ...all[lang], ...update } }));
  }

  function translate() {
    if (lang === "he") return;
    setError(null);
    const target = lang;
    startTransition(async () => {
      const res = await translateProposalTexts(target, texts.he);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setTexts((all) => ({
        ...all,
        [target]: {
          ...res.texts,
          why: [...res.texts.why, "", "", ""].slice(0, 3),
          // keep values that already had a fixed translation (foot, citizenship...)
          facts: { ...res.texts.facts, ...Object.fromEntries(Object.entries(all[target].facts).filter(([, v]) => v)) },
        },
      }));
    });
  }

  function savePdf() {
    const display = (lang === "he" ? names.he : names[lang] || names.en) || "player";
    const prev = document.title;
    document.title = `VERA - ${display} - ${lang.toUpperCase()}`;
    window.print();
    setTimeout(() => {
      document.title = prev;
    }, 1000);
  }

  const displayName = (lang === "he" ? names.he : names[lang] || names.en) || names.he || "";
  const altName = lang === "he" ? names.en : "";
  const chosenLinks = props.links.filter((l) => selected.includes(l.id));
  const qrLink = chosenLinks.find((l) => l.isVideo && props.qr[l.id]);
  const transferMain = TRANSFER_OPTIONS[terms.transfer]?.[lang] ?? "";
  const transferSub = terms.amount || (["fee", "fee_training", "loan_option"].includes(terms.transfer) ? NEGOTIABLE[lang] : "");
  const visibleFacts = props.facts.filter((f) => (t.facts[f.id] ?? "").trim());
  const missing = useMemo(() => {
    const m: string[] = [];
    if (!props.photoUrl) m.push("אין תמונה בכרטיס השחקן");
    if (!props.hive.length) m.push("אין דוח סקאוטינג, הכוורת תופיע ריקה");
    if (!chosenLinks.some((l) => l.isVideo)) m.push("לא נבחר וידאו");
    if (lang !== "he" && !t.summary.trim()) m.push("הסיכום בשפה הזו ריק, לחץ על תרגום");
    if (lang !== "he" && !displayName.trim()) m.push("חסר שם באותיות לטיניות");
    return m;
  }, [props.photoUrl, props.hive.length, chosenLinks, lang, t.summary, displayName]);

  return (
    <div className="vp" dir="rtl">
      <aside className="vp-editor">
        <div className="vp-ed-head">
          <h1>הצעת שחקן · VERA</h1>
          <p>עמוד A4 אחד. הכוורת, הקישורים והתמונה נמשכים מכרטיס השחקן.</p>
        </div>

        <div className="vp-ed-row">
          <span className="vp-ed-label">שפת ההצעה</span>
          <div className="vp-seg" role="group" aria-label="שפה">
            {PROPOSAL_LANGS.map((l) => (
              <button key={l} type="button" aria-pressed={lang === l} onClick={() => setLang(l)}>
                {LANG_NAMES[l]}
              </button>
            ))}
          </div>
        </div>

        {lang !== "he" && (
          <div className="vp-ed-row">
            <button type="button" className="btn btn-gold" onClick={translate} disabled={pending}>
              {pending ? "מתרגם…" : `תרגם מעברית ל${LANG_NAMES[lang]}`}
            </button>
            {error && <p className="vp-ed-error">{error}</p>}
            <label className="vp-field">
              <span>שם השחקן ({LANG_NAMES[lang]})</span>
              <input id="vp-name" dir="ltr" value={names[lang] ?? ""} onChange={(e) => setNames({ ...names, [lang]: e.target.value })} />
            </label>
          </div>
        )}

        <label className="vp-field">
          <span>מיועד למועדון</span>
          <input id="vp-for" value={preparedFor} onChange={(e) => setPreparedFor(e.target.value)} placeholder="Red Star Belgrade" />
        </label>

        <fieldset className="vp-ed-group">
          <legend>תנאי עסקה</legend>
          <label className="vp-field">
            <span>העברה</span>
            <select id="vp-transfer" value={terms.transfer} onChange={(e) => setTerms({ ...terms, transfer: e.target.value })}>
              {Object.entries(TRANSFER_OPTIONS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v.he}
                </option>
              ))}
            </select>
          </label>
          <label className="vp-field">
            <span>סכום העברה (אופציונלי)</span>
            <input id="vp-amount" dir="ltr" value={terms.amount} onChange={(e) => setTerms({ ...terms, amount: e.target.value })} placeholder="€500K" />
          </label>
          <label className="vp-field">
            <span>שכר מבוקש משוער (ריק = לפי משא ומתן)</span>
            <input id="vp-salary" dir="ltr" value={terms.salary} onChange={(e) => setTerms({ ...terms, salary: e.target.value })} placeholder="€120K–150K / season" />
          </label>
          <label className="vp-field">
            <span>זמינות ({LANG_NAMES[lang]})</span>
            <input id="vp-avail" dir={rtl ? "rtl" : "ltr"} value={t.availability} onChange={(e) => patch({ availability: e.target.value })} />
          </label>
        </fieldset>

        <fieldset className="vp-ed-group">
          <legend>טקסט ({LANG_NAMES[lang]})</legend>
          <label className="vp-field">
            <span>סטטוס (שורה מתחת לשם)</span>
            <input id="vp-status" dir={rtl ? "rtl" : "ltr"} value={t.status} onChange={(e) => patch({ status: e.target.value })} />
          </label>
          <label className="vp-field">
            <span>סיכום מקצועי · עד כ-330 תווים ({t.summary.length})</span>
            <textarea id="vp-summary" dir={rtl ? "rtl" : "ltr"} rows={5} value={t.summary} onChange={(e) => patch({ summary: e.target.value })} />
          </label>
          {[0, 1, 2].map((i) => (
            <label key={i} className="vp-field">
              <span>למה הוא · {i + 1}</span>
              <input
                id={`vp-why-${i}`}
                dir={rtl ? "rtl" : "ltr"}
                value={t.why[i] ?? ""}
                onChange={(e) => {
                  const why = [...t.why];
                  why[i] = e.target.value;
                  patch({ why });
                }}
              />
            </label>
          ))}
        </fieldset>

        <details className="vp-ed-group">
          <summary>נתוני מפתח ({LANG_NAMES[lang]})</summary>
          {props.facts.map((f) => (
            <label key={f.id} className="vp-field">
              <span>{f.label.he}</span>
              <input
                id={`vp-fact-${f.id}`}
                dir={rtl ? "rtl" : "ltr"}
                value={t.facts[f.id] ?? ""}
                onChange={(e) => patch({ facts: { ...t.facts, [f.id]: e.target.value } })}
              />
            </label>
          ))}
        </details>

        <fieldset className="vp-ed-group">
          <legend>וידאו וקישורים מהכרטיס</legend>
          {props.links.length === 0 && <p className="vp-ed-note">אין קישורים בכרטיס השחקן.</p>}
          {props.links.map((l) => (
            <label key={l.id} className="vp-check">
              <input
                type="checkbox"
                checked={selected.includes(l.id)}
                onChange={(e) => setSelected(e.target.checked ? [...selected, l.id] : selected.filter((x) => x !== l.id))}
              />
              <span>
                {l.type} · {l.title}
              </span>
            </label>
          ))}
        </fieldset>

        <details className="vp-ed-group">
          <summary>פרטי קשר בתחתית</summary>
          <label className="vp-field">
            <span>שם</span>
            <input id="vp-c-name" dir="ltr" value={contact.name} onChange={(e) => setContact({ ...contact, name: e.target.value })} />
          </label>
          <label className="vp-field">
            <span>טלפון</span>
            <input id="vp-c-phone" dir="ltr" value={contact.phone} onChange={(e) => setContact({ ...contact, phone: e.target.value })} />
          </label>
          <label className="vp-field">
            <span>מייל</span>
            <input id="vp-c-email" dir="ltr" value={contact.email} onChange={(e) => setContact({ ...contact, email: e.target.value })} />
          </label>
        </details>

        {missing.length > 0 && (
          <ul className="vp-ed-warn">
            {missing.map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ul>
        )}
        {overflow && <p className="vp-ed-error">הטקסט ארוך מעמוד אחד. קצר את הסיכום או את הנקודות.</p>}

        <button type="button" className="btn btn-gold vp-print" onClick={savePdf}>
          שמור PDF ({LANG_NAMES[lang]})
        </button>
        <p className="vp-ed-note">בחלון ההדפסה בחר &quot;שמירה כ-PDF&quot;. בטלפון: שיתוף, הדפסה, ואז שמירה.</p>
      </aside>

      <div className="vp-stage" ref={stageRef}>
        <article className="vp-sheet" ref={sheetRef} lang={lang} dir={rtl ? "rtl" : "ltr"}>
          <svg className="vp-cut" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            <polygon className="vp-cut-1" points={rtl ? "100,0 74,0 56,100 100,100" : "0,0 26,0 44,100 0,100"} />
            <polygon className="vp-cut-2" points={rtl ? "74,0 72,0 54,100 56,100" : "26,0 28,0 46,100 44,100"} />
          </svg>

          <header className="vp-top">
            <span className="vp-wordmark" dir="ltr">
              VERA
            </span>
            <span className="vp-top-meta">
              {u.eyebrow} · <bdi>{seasonLabel(props.today)}</bdi>
              {preparedFor && (
                <>
                  {" "}
                  · {u.prepared} <bdi>{preparedFor}</bdi>
                </>
              )}
            </span>
          </header>

          <section className="vp-hero">
            <figure className={`vp-photo${props.photoUrl ? "" : " vp-photo-empty"}`}>
              {props.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={props.photoUrl} alt={displayName} />
              ) : (
                <span>{u.photo}</span>
              )}
            </figure>
            <div className="vp-ident">
              <h2 className="vp-name">{displayName}</h2>
              {altName && (
                <p className="vp-alt">
                  <bdi>{altName}</bdi>
                </p>
              )}
              <p className="vp-dataline" dir="ltr">
                {props.dataline.join(" · ")}
              </p>
              {t.status && <span className="vp-pill">{t.status}</span>}
            </div>
          </section>

          {visibleFacts.length > 0 && (
            <section className="vp-sec">
              <h3>{u.facts}</h3>
              <dl className="vp-facts">
                {visibleFacts.map((f) => (
                  <div key={f.id} className="vp-fact">
                    <dt>{f.label[lang]}</dt>
                    <dd>
                      <bdi>{t.facts[f.id]}</bdi>
                    </dd>
                  </div>
                ))}
              </dl>
            </section>
          )}

          <section className="vp-sec">
            <h3>{u.terms}</h3>
            <div className="vp-terms">
              <TermCell k={u.transfer} main={transferMain} sub={transferSub} />
              <TermCell k={u.salary} main={terms.salary || NEGOTIABLE[lang]} />
              {t.availability && <TermCell k={u.avail} main={t.availability} />}
            </div>
          </section>

          <section className="vp-mid">
            <figure className="vp-hive">
              <figcaption className="vp-hive-h">
                <span>{u.hive}</span>
                <span className="vp-hive-tag" dir="ltr">
                  VERA HIVE
                </span>
              </figcaption>
              <Hive axes={props.hive} lang={lang} />
              <p className="vp-hive-src">{props.hive.length ? u.hiveSource : u.pending}</p>
            </figure>
            <div className="vp-mid-r">
              <h3>{u.summary}</h3>
              <p className="vp-lede">{t.summary}</p>
              {t.why.some((w) => w.trim()) && (
                <>
                  <h3 className="vp-why-h">{u.why}</h3>
                  <ul className="vp-why">
                    {t.why
                      .filter((w) => w.trim())
                      .map((w, i) => (
                        <li key={i}>{w}</li>
                      ))}
                  </ul>
                </>
              )}
            </div>
          </section>

          {chosenLinks.length > 0 && (
            <section className="vp-media">
              <div className="vp-links">
                <h3>{u.links}</h3>
                {chosenLinks.slice(0, 4).map((l) => (
                  <a key={l.id} className="vp-link" href={l.url} target="_blank" rel="noopener noreferrer">
                    <span className="vp-link-t">{l.type}</span>
                    <span className="vp-link-d">
                      <bdi>{l.title}</bdi>
                    </span>
                    <span className="vp-link-a" aria-hidden="true">
                      {rtl ? "←" : "→"}
                    </span>
                  </a>
                ))}
              </div>
              {qrLink && (
                <figure className="vp-qr">
                  <span dangerouslySetInnerHTML={{ __html: props.qr[qrLink.id] }} />
                  <figcaption>{u.scan}</figcaption>
                </figure>
              )}
            </section>
          )}

          <footer className="vp-band">
            <div>
              <h3>{u.contact}</h3>
              <p className="vp-band-note">{DEFAULT_CONTACT.note[lang]}</p>
            </div>
            <div>
              <p className="vp-who">
                <span className="vp-who-n">{contact.name}</span>
                <span className="vp-who-t">{DEFAULT_CONTACT.title[lang]}</span>
              </p>
              <ul className="vp-clines">
                {contact.phone && (
                  <li>
                    <span className="vp-cl-k">{u.phone}</span>
                    <bdi className="vp-cl-v">{contact.phone}</bdi>
                  </li>
                )}
                {contact.email && (
                  <li>
                    <span className="vp-cl-k">{u.email}</span>
                    <bdi className="vp-cl-v">{contact.email}</bdi>
                  </li>
                )}
              </ul>
            </div>
            <p className="vp-fine">
              <span>{u.conf}</span>
              <span dir="ltr">{props.today}</span>
            </p>
          </footer>
        </article>
      </div>
    </div>
  );
}

function seasonLabel(today: string): string {
  // today is dd.mm.yyyy; seasons turn over in July
  const [, mm, yyyy] = today.split(".").map(Number);
  const start = mm >= 7 ? yyyy : yyyy - 1;
  return `${start}/${String((start + 1) % 100).padStart(2, "0")}`;
}

function TermCell({ k, main, sub }: { k: string; main: string; sub?: string }) {
  return (
    <div className="vp-term">
      <span className="vp-term-k">{k}</span>
      <span className="vp-term-v">
        <bdi>{main}</bdi>
      </span>
      {sub && (
        <span className="vp-term-s">
          <bdi>{sub}</bdi>
        </span>
      )}
    </div>
  );
}

function Hive({ axes, lang }: { axes: HiveAxis[]; lang: ProposalLang }) {
  const W = 480;
  const H = 392;
  const cx = W / 2;
  const cy = H / 2 + 6;
  const R = 118;
  const n = axes.length || 6;
  const pt = (i: number, r: number): [number, number] => {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / n;
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  };
  const poly = (r: (i: number) => number) =>
    Array.from({ length: n }, (_, i) => pt(i, r(i)).map((v) => v.toFixed(1)).join(",")).join(" ");

  return (
    <svg className="vp-hive-svg" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="hive">
      {[2, 4, 6, 8, 10].map((k) => (
        <polygon key={k} className={k === 10 ? "vp-ring vp-ring-outer" : "vp-ring"} points={poly(() => (R * k) / 10)} />
      ))}
      {Array.from({ length: n }, (_, i) => {
        const [x, y] = pt(i, R);
        return <line key={i} className="vp-spoke" x1={cx} y1={cy} x2={x} y2={y} />;
      })}
      {axes.length > 0 && (
        <>
          <polygon className="vp-shape" points={poly((i) => (R * Math.max(0, Math.min(10, axes[i].value))) / 10)} />
          {axes.map((a, i) => {
            const [x, y] = pt(i, (R * Math.max(0, Math.min(10, a.value))) / 10);
            return <circle key={a.key} className="vp-node" cx={x} cy={y} r={3.6} />;
          })}
          {axes.map((a, i) => {
            const [x, y] = pt(i, R + 24);
            const ang = -90 + (i * 360) / n;
            const c = Math.cos((ang * Math.PI) / 180);
            const anchor = Math.abs(c) < 0.2 ? "middle" : c > 0 ? "start" : "end";
            const val = a.value.toFixed(1);
            if (Math.abs(c) < 0.2 && ang < 0)
              return (
                <g key={a.key}>
                  <text className="vp-lbl-val" x={x} y={y - 18} textAnchor="middle">{val}</text>
                  <text className="vp-lbl" x={x} y={y} textAnchor="middle">{a.label[lang]}</text>
                </g>
              );
            if (Math.abs(c) < 0.2)
              return (
                <g key={a.key}>
                  <text className="vp-lbl" x={x} y={y + 12} textAnchor="middle">{a.label[lang]}</text>
                  <text className="vp-lbl-val" x={x} y={y + 30} textAnchor="middle">{val}</text>
                </g>
              );
            return (
              <g key={a.key}>
                <text className="vp-lbl" x={x} y={y - 2} textAnchor={anchor}>{a.label[lang]}</text>
                <text className="vp-lbl-val" x={x} y={y + 16} textAnchor={anchor}>{val}</text>
              </g>
            );
          })}
        </>
      )}
    </svg>
  );
}
