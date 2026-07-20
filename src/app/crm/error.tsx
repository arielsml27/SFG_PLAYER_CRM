"use client";

export default function CrmError({ error }: { error: Error & { digest?: string } }) {
  const isStaleAction = /Failed to find Server Action/i.test(error.message);

  return (
    <div className="min-h-full flex items-center justify-center p-8" dir="rtl" lang="he">
      <div className="card p-6 max-w-md text-center space-y-4">
        <h1 className="text-lg font-bold">{isStaleAction ? "יש גרסה חדשה של המערכת" : "משהו השתבש"}</h1>
        <p className="text-sm" style={{ color: "var(--muted)" }}>
          {isStaleAction
            ? "המערכת עודכנה מאז שפתחת את הדף. יש לרענן את הדף כדי לטעון את הגרסה העדכנית."
            : "אירעה שגיאה בלתי צפויה. נסה לרענן את הדף."}
        </p>
        <button onClick={() => window.location.reload()} className="btn btn-gold">
          רענן את הדף
        </button>
      </div>
    </div>
  );
}
