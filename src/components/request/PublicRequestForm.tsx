"use client";

import { useState, useTransition } from "react";
import "./public-request.css";
import {
  REQUEST_AGES,
  REQUEST_DEAL_TYPES,
  REQUEST_FORM_LANGS,
  REQUEST_FORM_UI,
  REQUEST_POSITIONS,
  REQUEST_WINDOWS,
  type RequestFormLang,
} from "@/lib/request-form";
import { submitPublicRequest } from "@/lib/request-link-actions";

type Props = {
  token: string;
  active: boolean;
  club: { name: string } | null;
  // Set when the link is pinned to a CRM contact: these fields are read-only.
  contact: { name: string; role: string | null; phone: string | null } | null;
  // A name typed when the link was created (no CRM contact): just a prefill.
  contactName: string | null;
  agentName: string;
};

const LANG_LABEL: Record<RequestFormLang, string> = { he: "עברית", en: "EN" };

function Chips<T extends string>({
  items,
  lang,
  value,
  onChange,
  multiple,
  name,
}: {
  items: { id: string; label: Record<RequestFormLang, string> }[];
  lang: RequestFormLang;
  value: T[] | T;
  onChange: (id: T) => void;
  multiple?: boolean;
  name: string;
}) {
  const selected = (id: string) => (Array.isArray(value) ? value.includes(id as T) : value === id);
  return (
    <div className="rq-chips" role={multiple ? "group" : "radiogroup"} aria-label={name}>
      {items.map((it) => (
        <button
          key={it.id}
          type="button"
          className="rq-chip"
          role={multiple ? undefined : "radio"}
          aria-pressed={multiple ? selected(it.id) : undefined}
          aria-checked={multiple ? undefined : selected(it.id)}
          onClick={() => onChange(it.id as T)}
        >
          {it.label[lang]}
        </button>
      ))}
    </div>
  );
}

export default function PublicRequestForm(props: Props) {
  const [lang, setLang] = useState<RequestFormLang>("he");
  const [positions, setPositions] = useState<string[]>([]);
  const [win, setWin] = useState("both");
  const [dealType, setDealType] = useState("any");
  const [age, setAge] = useState("any");
  const [priority, setPriority] = useState("");
  const [clubName, setClubName] = useState(props.club?.name ?? "");
  const [name, setName] = useState(props.contact?.name ?? props.contactName ?? "");
  const [role, setRole] = useState(props.contact?.role ?? "");
  const [phone, setPhone] = useState(props.contact?.phone ?? "");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [pending, start] = useTransition();

  const u = REQUEST_FORM_UI[lang];
  const rtl = lang === "he";
  const contactLocked = !!props.contact;
  const clubLocked = !!props.club;

  function togglePosition(id: string) {
    setPositions((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (positions.length === 0) {
      setError(u.needPosition);
      return;
    }
    start(async () => {
      const result = await submitPublicRequest(props.token, {
        positions,
        window: win,
        dealType,
        age,
        priority,
        clubName,
        name,
        role,
        phone,
        lang,
      });
      if (result.ok) setDone(true);
      else setError(REQUEST_FORM_UI[lang][result.error] ?? u.failed);
    });
  }

  const header = (
    <header className="rq-top">
      <span className="rq-wordmark" dir="ltr">
        VERA
      </span>
      <div className="rq-seg" role="group" aria-label="Language">
        {REQUEST_FORM_LANGS.map((l) => (
          <button key={l} type="button" aria-pressed={lang === l} onClick={() => setLang(l)}>
            {LANG_LABEL[l]}
          </button>
        ))}
      </div>
    </header>
  );

  const footer = (
    <footer className="rq-band">
      <span className="rq-who-n">{props.agentName}</span>
      <span className="rq-who-t">{u.agentTitle}</span>
      <span className="rq-fine">VERA · {lang === "he" ? "שאלון פנימי" : "internal form"}</span>
    </footer>
  );

  return (
    <div className="rq" lang={lang} dir={rtl ? "rtl" : "ltr"}>
      <svg className="rq-cut" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        <polygon className="rq-cut-1" points={rtl ? "100,0 74,0 56,100 100,100" : "0,0 26,0 44,100 0,100"} />
        <polygon className="rq-cut-2" points={rtl ? "74,0 72,0 54,100 56,100" : "26,0 28,0 46,100 44,100"} />
      </svg>

      <div className="rq-wrap">
        {header}

        {done ? (
          <section className="rq-done" aria-live="polite">
            <span className="rq-done-mark" aria-hidden="true">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </span>
            <h1>{u.thanksTitle}</h1>
            <p>{u.thanks}</p>
          </section>
        ) : !props.active ? (
          <section className="rq-done">
            <h1>{u.inactive}</h1>
          </section>
        ) : (
          <>
            <section className="rq-head">
              <p className="rq-eyebrow">{u.eyebrow}</p>
              <h1 className="rq-title">{u.title}</h1>
              <p className="rq-lede">{u.lede}</p>
              {props.club && (
                <p className="rq-for">
                  <span className="rq-for-k">{u.club}</span>
                  <span className="rq-for-v">{props.club.name}</span>
                </p>
              )}
            </section>

            <form className="rq-form" onSubmit={submit} noValidate>
              <fieldset className="rq-group">
                <legend>
                  {u.position}
                  <span className="rq-hint">{u.positionHint}</span>
                </legend>
                <Chips items={REQUEST_POSITIONS} lang={lang} value={positions} onChange={togglePosition} multiple name={u.position} />
              </fieldset>

              <fieldset className="rq-group">
                <legend>{u.window}</legend>
                <Chips items={REQUEST_WINDOWS} lang={lang} value={win} onChange={setWin} name={u.window} />
              </fieldset>

              <fieldset className="rq-group">
                <legend>{u.dealType}</legend>
                <Chips items={REQUEST_DEAL_TYPES} lang={lang} value={dealType} onChange={setDealType} name={u.dealType} />
              </fieldset>

              <fieldset className="rq-group">
                <legend>{u.age}</legend>
                <Chips items={REQUEST_AGES} lang={lang} value={age} onChange={setAge} name={u.age} />
              </fieldset>

              <label className="rq-field">
                <span className="rq-label">{u.priority}</span>
                <input
                  type="text"
                  value={priority}
                  maxLength={200}
                  placeholder={u.priorityPh}
                  onChange={(e) => setPriority(e.target.value)}
                  autoComplete="off"
                />
              </label>

              <fieldset className="rq-group">
                <legend>{u.details}</legend>
                <div className="rq-details">
                  {!clubLocked && (
                    <label className="rq-field rq-span">
                      <span className="rq-label">{u.club}</span>
                      <input type="text" value={clubName} maxLength={120} onChange={(e) => setClubName(e.target.value)} autoComplete="organization" />
                    </label>
                  )}
                  <label className="rq-field">
                    <span className="rq-label">{u.name}</span>
                    <input
                      type="text"
                      value={name}
                      maxLength={120}
                      readOnly={contactLocked}
                      onChange={(e) => setName(e.target.value)}
                      autoComplete="name"
                    />
                  </label>
                  <label className="rq-field">
                    <span className="rq-label">{u.role}</span>
                    <input
                      type="text"
                      value={role}
                      maxLength={80}
                      readOnly={contactLocked && !!props.contact?.role}
                      placeholder={contactLocked ? undefined : u.rolePh}
                      onChange={(e) => setRole(e.target.value)}
                      autoComplete="organization-title"
                    />
                  </label>
                  <label className="rq-field rq-span">
                    <span className="rq-label">{u.phone}</span>
                    <input
                      type="tel"
                      dir="ltr"
                      value={phone}
                      maxLength={40}
                      readOnly={contactLocked && !!props.contact?.phone}
                      onChange={(e) => setPhone(e.target.value)}
                      autoComplete="tel"
                      inputMode="tel"
                    />
                  </label>
                </div>
              </fieldset>

              <p className="rq-privacy">{u.privacy}</p>

              {error && (
                <p className="rq-error" role="alert">
                  {error}
                </p>
              )}

              <button type="submit" className="rq-submit" disabled={pending}>
                {pending ? u.sending : u.submit}
              </button>
            </form>
          </>
        )}

        {footer}
      </div>
    </div>
  );
}
