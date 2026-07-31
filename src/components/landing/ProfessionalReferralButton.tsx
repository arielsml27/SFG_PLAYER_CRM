"use client";

import { useState } from "react";
import { Loader2, Check } from "lucide-react";
import { requestProfessionalReferral } from "@/lib/actions";

export default function ProfessionalReferralButton({ playerId, firstName }: { playerId: string; firstName: string }) {
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");

  async function handleClick() {
    setState("sending");
    try {
      await requestProfessionalReferral(playerId, firstName);
      setState("sent");
    } catch (e) {
      console.error(e);
      setState("idle");
    }
  }

  if (state === "sent") {
    return (
      <div className="lp-btn-glass rounded-full px-6 py-2.5 text-sm font-semibold inline-flex items-center gap-2" style={{ color: "var(--lp-gold-soft)" }}>
        <Check size={15} /> הבקשה נשלחה, הצוות שלנו יחזור אליך
      </div>
    );
  }

  return (
    <button
      type="button"
      disabled={state === "sending"}
      onClick={handleClick}
      className="lp-btn-gold rounded-full px-6 py-2.5 text-sm font-bold inline-flex items-center justify-center gap-2 transition-shadow disabled:opacity-60"
    >
      {state === "sending" ? (
        <>
          <Loader2 size={15} className="animate-spin" /> שולח...
        </>
      ) : (
        "בקש/י חיבור לאיש מקצוע"
      )}
    </button>
  );
}
