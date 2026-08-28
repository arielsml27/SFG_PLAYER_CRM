import { statusTone } from "@/lib/constants";

/** כותרת מקטע: עברית · קו שיער · לטינית. חתימת המותג. */
export function SectionHead({ title, latin }: { title: string; latin?: string }) {
  return (
    <div className="section-head">
      <h2>{title}</h2>
      <div className="rule" />
      {latin ? <div className="latin">{latin}</div> : null}
    </div>
  );
}

/** תא במיקרו-לייבל זהב מעל ערך — כמו בהצעת המחיר. */
export function Cell({
  label,
  value,
  dir,
}: {
  label: string;
  value: React.ReactNode;
  dir?: "ltr" | "rtl";
}) {
  return (
    <div className="cell">
      <div className="micro">{label}</div>
      <div className="val" style={dir ? { direction: dir } : undefined}>
        {value}
      </div>
    </div>
  );
}

export function SpecRow({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="spec-row">
      <span className="k">{k}</span>
      <span className="v">{v}</span>
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  return <span className={`badge badge-${statusTone(status)}`}>{status}</span>;
}

export function Badge({
  children,
  tone = "quiet",
}: {
  children: React.ReactNode;
  tone?: "accent" | "good" | "warn" | "danger" | "quiet";
}) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="field">
      <label>{label}</label>
      {children}
      {hint ? <span className="hint">{hint}</span> : null}
    </div>
  );
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <div className="empty">{children}</div>;
}

export function PageHead({
  title,
  sub,
  children,
}: {
  title: string;
  sub?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="page-head">
      <div>
        <h1>{title}</h1>
        {sub ? <div className="sub">{sub}</div> : null}
      </div>
      {children ? <div className="page-actions">{children}</div> : null}
    </div>
  );
}
