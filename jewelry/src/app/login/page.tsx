import Image from "next/image";
import LoginForm from "./LoginForm";

export const metadata = { title: "כניסה · Samuel" };

export default function LoginPage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: "var(--space-5)",
      }}
    >
      <div style={{ width: "min(380px, 100%)" }} className="stack">
        <div style={{ display: "grid", placeItems: "center", gap: 8, marginBottom: 8 }}>
          <Image src="/brand/samuel-logo.png" alt="Samuel" width={330} height={104} priority />
          <span className="micro">ניהול פנימי</span>
        </div>
        <hr className="hairline" />
        <div className="panel stack">
          <LoginForm />
        </div>
        <p className="quiet" style={{ fontSize: 12, textAlign: "center" }}>
          המערכת רצה מקומית על המחשב שלך.
        </p>
      </div>
    </div>
  );
}
