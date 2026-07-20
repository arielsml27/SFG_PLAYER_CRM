"use client";

export default function RootError({ error }: { error: Error & { digest?: string } }) {
  const isStaleAction = /Failed to find Server Action/i.test(error.message);

  return (
    <div
      className="min-h-screen flex items-center justify-center p-8"
      style={{ background: "var(--lp-bg)", color: "var(--lp-fg)" }}
    >
      <div
        className="rounded-xl p-6 max-w-md text-center space-y-4"
        style={{ background: "var(--lp-glass-bg)", border: "1px solid var(--lp-glass-border)" }}
      >
        <h1 className="text-lg font-bold">{isStaleAction ? "A new version is available" : "Something went wrong"}</h1>
        <p className="text-sm" style={{ color: "var(--lp-muted)" }}>
          {isStaleAction
            ? "This page was updated since you opened it. Please reload to get the latest version."
            : "An unexpected error occurred. Please try reloading the page."}
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 rounded-md font-medium"
          style={{ background: "var(--lp-gold)", color: "var(--lp-bg)" }}
        >
          Reload
        </button>
      </div>
    </div>
  );
}
