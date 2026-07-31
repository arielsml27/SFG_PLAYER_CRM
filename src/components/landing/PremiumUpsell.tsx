"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  Loader2,
  PhoneCall,
  ClipboardList,
  LayoutDashboard,
  Handshake,
  Database,
  Globe2,
  BarChart3,
  Users,
  UserCheck,
  Sparkles,
  ArrowLeft,
} from "lucide-react";
import { requestPremiumUpgrade, requestGoldUpgrade } from "@/lib/actions";

const WHO_WE_ARE = [
  { icon: Database, text: "מערכת מבוססת דאטה עם מאות מקרי עבר וניתוח מעברים ומקרים דומים" },
  {
    icon: Globe2,
    text: "ניסיון בעבודה עם כל המועדונים בשוק מכל הצדדים (סוכנים, סקאוטים במחלקות המובילות) והכרות מעמיקה עם השוק",
  },
];

const BASIC_BENEFITS = [
  "פרופיל נוצר ונשלח לצוות הסקאוטינג שלנו",
  "דף בפלטפורמה שלנו עם אפשרות מעקב של סוכנים, סקאוטים ומנהלים מקצועיים בארץ ובחול",
];

const PREMIUM_BENEFITS = [
  { icon: PhoneCall, text: "פגישת ייעוץ אישית חד-פעמית של שעה, זום או פרונטלית, עם מנהל מקצועי מטעמנו" },
  { icon: ClipboardList, text: "דוח סקאוטינג מפורט עם יעדים ל-3 החודשים הקרובים ולעונה הקרובה" },
  { icon: LayoutDashboard, text: "דף מלא בפלטפורמה שלנו, עם אפשרות מעקב והעלאת תכנים" },
  { icon: Handshake, text: "המלצות ממוקדות לאנשי מקצוע רלוונטיים, לפי הנקודות שהפרופיל שלך צריך לחזק" },
];

const GOLD_BENEFITS = [
  { icon: PhoneCall, text: "3 פגישות, פרונטליות או בזום, של שעה כל אחת" },
  { icon: ClipboardList, text: "דוח סקאוטינג מפורט עם חוזקות, חולשות ודברים שצריך לשפר לשלושת החודשים הקרובים" },
  { icon: BarChart3, text: "ניתוח אנליסטי אישי 1:1 של 5 משחקים" },
  { icon: Globe2, text: "ניתוח מלא של הקבוצה הבאה שלך, על בסיס המצב הקיים מול מה שצפוי לך" },
  { icon: Handshake, text: "הכוונה במשא ומתן וייעוץ בבחירת ייצוג רלוונטי" },
  { icon: Users, text: "גישה למאגר אנשי מקצוע" },
  { icon: UserCheck, text: "בחירת סוכן נכון עבור המטרות שלך" },
  { icon: Sparkles, text: "הכוונה לכל שירות שאתה צריך, ממוקד למטרות שלך" },
  { icon: LayoutDashboard, text: "דף מלא בפלטפורמה שלנו עם הכוונות ופיצ'רים נוספים, כמו בניית מותג ברשתות חברתיות והתנהלות פיננסית" },
];

export default function PremiumUpsell({ playerId, firstName }: { playerId: string; firstName: string }) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState<"premium" | "gold" | null>(null);

  async function goToProfile() {
    router.push(`/players/${playerId}`);
  }

  async function upgrade() {
    setSubmitting("premium");
    try {
      await requestPremiumUpgrade(playerId, firstName);
    } catch (e) {
      console.error(e);
    } finally {
      await goToProfile();
    }
  }

  async function upgradeGold() {
    setSubmitting("gold");
    try {
      await requestGoldUpgrade(playerId, firstName);
    } catch (e) {
      console.error(e);
    } finally {
      await goToProfile();
    }
  }

  return (
    <div className="lp-page min-h-screen flex items-center justify-center px-6 py-16" dir="rtl" lang="he">
      <div className="w-full max-w-5xl">
        <div className="text-center mb-8">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            אתה בפנים, {firstName}. מוכן לצעד הבא?
          </h1>
          <p className="mt-3" style={{ color: "var(--lp-muted)" }}>
            הפרופיל שלך נוצר. הנה איך אתה יכול להתקדם הלאה עם SFG.
          </p>
        </div>

        <div className="lp-glass rounded-3xl p-6 mb-8">
          <div className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: "var(--lp-gold-soft)" }}>
            מי אנחנו
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {WHO_WE_ARE.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-start gap-2.5 text-sm">
                <Icon size={16} className="shrink-0 mt-0.5" style={{ color: "var(--lp-gold)" }} />
                <span>{text}</span>
              </div>
            ))}
          </div>
        </div>

        <div
          className="lp-glass rounded-3xl p-7 mb-8 flex flex-col sm:flex-row items-center gap-5 text-center sm:text-right"
          style={{ border: "1.5px solid var(--lp-gold)" }}
        >
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0"
            style={{ background: "rgba(227,181,99,0.12)", color: "var(--lp-gold)" }}
          >
            <ClipboardList size={26} />
          </div>
          <div className="flex-1">
            <div className="text-lg font-bold">בואו נכיר אותך לעומק</div>
            <p className="text-sm mt-1" style={{ color: "var(--lp-muted)" }}>
              שאלון מקצועי מורחב שכל שחקן ב-SFG ממלא: רקע, יכולות, הרגלים ומטרות. ככל שנכיר אותך יותר טוב, כך נוכל
              לכוון אותך נכון יותר.
            </p>
          </div>
          <button
            type="button"
            disabled={submitting !== null}
            onClick={() => router.push(`/questionnaire/${playerId}`)}
            className="lp-btn-gold rounded-full px-6 py-3 text-sm font-bold shrink-0 inline-flex items-center justify-center gap-2 transition-shadow disabled:opacity-60"
          >
            מלא את השאלון המקצועי <ArrowLeft size={15} />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-stretch">
          <div className="lp-glass rounded-3xl p-7 opacity-60 flex flex-col">
            <div className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--lp-muted)" }}>
              בייסיק
            </div>
            <div className="text-2xl font-bold mt-1 mb-5">חינם</div>
            <div className="space-y-3">
              {BASIC_BENEFITS.map((text) => (
                <div key={text} className="flex items-start gap-2.5 text-sm">
                  <Check size={16} className="shrink-0 mt-0.5" style={{ color: "var(--lp-gold)" }} />
                  <span>{text}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="lp-glass rounded-3xl p-7 flex flex-col" style={{ border: "1.5px solid var(--lp-gold)" }}>
            <div className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--lp-gold-soft)" }}>
              פרימיום
            </div>
            <div className="mt-1 mb-5">
              <div className="text-2xl font-bold">₪150<span className="text-sm font-semibold" style={{ color: "var(--lp-muted)" }}> / לחודש</span></div>
              <div className="text-xs mt-0.5" style={{ color: "var(--lp-muted)" }}>₪1,800 לשנה</div>
            </div>
            <div className="space-y-3">
              {PREMIUM_BENEFITS.map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-start gap-2.5 text-sm">
                  <Icon size={16} className="shrink-0 mt-0.5" style={{ color: "var(--lp-gold)" }} />
                  <span>{text}</span>
                </div>
              ))}
            </div>
            <button
              type="button"
              disabled={submitting !== null}
              onClick={upgrade}
              className="lp-btn-gold rounded-full px-6 py-2.5 text-sm font-bold w-full mt-auto pt-6 inline-flex items-center justify-center gap-2 transition-shadow disabled:opacity-60"
            >
              {submitting === "premium" ? (
                <>
                  <Loader2 size={15} className="animate-spin" /> שולח בקשה...
                </>
              ) : (
                "שדרג לפרימיום"
              )}
            </button>
          </div>

          <div className="lp-glass rounded-3xl p-7 flex flex-col" style={{ border: "1.5px solid var(--lp-gold)" }}>
            <div className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--lp-gold-soft)" }}>
              GOLD
            </div>
            <div className="mt-1 mb-5">
              <div className="text-2xl font-bold">₪550<span className="text-sm font-semibold" style={{ color: "var(--lp-muted)" }}> / לחודש</span></div>
              <div className="text-xs mt-0.5" style={{ color: "var(--lp-muted)" }}>₪6,600 לשנה</div>
            </div>
            <div className="space-y-3">
              {GOLD_BENEFITS.map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-start gap-2.5 text-sm">
                  <Icon size={16} className="shrink-0 mt-0.5" style={{ color: "var(--lp-gold)" }} />
                  <span>{text}</span>
                </div>
              ))}
            </div>
            <button
              type="button"
              disabled={submitting !== null}
              onClick={upgradeGold}
              className="lp-btn-gold rounded-full px-6 py-2.5 text-sm font-bold w-full mt-auto pt-6 inline-flex items-center justify-center gap-2 transition-shadow disabled:opacity-60"
            >
              {submitting === "gold" ? (
                <>
                  <Loader2 size={15} className="animate-spin" /> שולח בקשה...
                </>
              ) : (
                "שדרג ל-GOLD"
              )}
            </button>
          </div>
        </div>

        <div className="text-center mt-6 flex flex-col items-center gap-3">
          <button
            type="button"
            disabled={submitting !== null}
            onClick={goToProfile}
            className="text-sm hover:opacity-80 transition-opacity disabled:opacity-40"
            style={{ color: "var(--lp-muted)" }}
          >
            לא כרגע, קח אותי לפרופיל שלי
          </button>
        </div>
      </div>
    </div>
  );
}
