"use client";

import { useState } from "react";
import Image from "next/image";
import {
  Handshake,
  Activity,
  Video,
  BadgeDollarSign,
  BarChart3,
  Globe2,
  ArrowLeft,
  PlayCircle,
} from "lucide-react";
import Reveal from "@/components/landing/Reveal";
import DashboardPreview from "@/components/landing/DashboardPreview";
import OnboardingWizard from "@/components/landing/OnboardingWizard";

const DEPARTMENTS = [
  {
    icon: Handshake,
    name: "ייצוג",
    description: "חוזים, משא ומתן וקשרי מועדונים בטיפול יועצים ייעודיים.",
  },
  {
    icon: Activity,
    name: "ביצועים",
    description: "פיתוח גופני, מנטלי וטכני במעקב מול מפת דרכים ברורה.",
  },
  {
    icon: Video,
    name: "מדיה",
    description: "סרטוני הייליטס, צילומים ומיתוג אישי שנבנה עבור סקאוטים וספונסרים.",
  },
  {
    icon: BadgeDollarSign,
    name: "מסחרי",
    description: "חסויות ועסקאות מותג שמותאמות לפרופיל ולשווי השוק של השחקן.",
  },
  {
    icon: BarChart3,
    name: "אנליטיקה",
    description: "ציון קריירה אחד על פני כל ממד בפיתוח השחקן.",
  },
  {
    icon: Globe2,
    name: "בינלאומי",
    description: "מבחנים, מעברים וחשיפה על פני ליגות והתאחדויות ברחבי העולם.",
  },
];

type Screen = "landing" | "onboarding";

export default function LandingPage() {
  const [screen, setScreen] = useState<Screen>("landing");

  const startOnboarding = () => setScreen("onboarding");

  if (screen === "onboarding") {
    return <OnboardingWizard onCancel={() => setScreen("landing")} />;
  }

  return (
    <div className="lp-page min-h-screen" dir="rtl" lang="he">
      <nav className="sticky top-0 z-50 lp-glass">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Image src="/logo-icon.png" alt="SFG" width={32} height={32} className="rounded-lg w-8 h-8" />
            <span className="font-bold tracking-tight">
              SFG <span style={{ color: "var(--lp-gold)" }}>OS</span>
            </span>
          </div>
          <div className="flex items-center gap-3">
            <a href="#preview" className="lp-btn-glass rounded-full px-4 py-2 text-sm font-semibold transition-colors">
              צפה בהדגמה
            </a>
            <button type="button" onClick={startOnboarding} className="lp-btn-gold rounded-full px-4 py-2 text-sm font-semibold transition-shadow">
              הצטרפות ל-SFG
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-20 pb-16 text-center">
        <Reveal>
          <div className="inline-flex items-center gap-2 lp-glass rounded-full px-4 py-1.5 text-xs font-semibold mb-8" style={{ color: "var(--lp-gold-soft)" }}>
            מערכת הפעלה לקריירת כדורגל
          </div>
        </Reveal>
        <Reveal delay={80}>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight leading-[1.1] max-w-4xl mx-auto">
            נהל את הקריירה שלך בכדורגל.
            <br />
            <span className="lp-gold-text">הכל במקום אחד.</span>
          </h1>
        </Reveal>
        <Reveal delay={160}>
          <p className="mt-6 text-base md:text-lg max-w-2xl mx-auto" style={{ color: "var(--lp-muted)" }}>
            ייצוג, ביצועים, מדיה, מסחר ואנליטיקה, הכל במרכז שליטה אחד שנבנה עבור שחקנים, משפחות
            והאנשים המקצועיים סביבם.
          </p>
        </Reveal>
        <Reveal delay={240}>
          <div className="mt-10 flex items-center justify-center gap-4 flex-wrap">
            <button
              type="button"
              onClick={startOnboarding}
              className="lp-btn-gold rounded-full px-6 py-3 text-sm font-bold inline-flex items-center gap-2 transition-shadow"
            >
              הצטרף ל-SFG כשחקן <ArrowLeft size={16} />
            </button>
            <a href="#preview" className="lp-btn-glass rounded-full px-6 py-3 text-sm font-semibold inline-flex items-center gap-2 transition-colors">
              <PlayCircle size={16} /> צפה בהדגמה
            </a>
          </div>
        </Reveal>
      </section>

      {/* Dashboard preview */}
      <section id="preview" className="max-w-6xl mx-auto px-6 pb-28 scroll-mt-24">
        <Reveal delay={100}>
          <DashboardPreview />
        </Reveal>
      </section>

      {/* Departments */}
      <section id="departments" className="max-w-6xl mx-auto px-6 pb-28 scroll-mt-24">
        <Reveal>
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">פלטפורמה אחת. כל מחלקה.</h2>
            <p className="mt-4 max-w-xl mx-auto" style={{ color: "var(--lp-muted)" }}>
              כל חלק בקריירת כדורגל, מתואם במקום אחד במקום מפוזר בין שיחות טלפון, גיליונות אקסל
              וקבוצות וואטסאפ.
            </p>
          </div>
        </Reveal>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {DEPARTMENTS.map((d, i) => {
            const Icon = d.icon;
            return (
              <Reveal key={d.name} delay={i * 70}>
                <div className="lp-glass rounded-2xl p-6 h-full transition-transform hover:-translate-y-1">
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center mb-4"
                    style={{ background: "rgba(227,181,99,0.12)", color: "var(--lp-gold)" }}
                  >
                    <Icon size={20} />
                  </div>
                  <div className="font-bold mb-1.5">{d.name}</div>
                  <div className="text-sm" style={{ color: "var(--lp-muted)" }}>
                    {d.description}
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </section>

      {/* Vision statement */}
      <section className="max-w-4xl mx-auto px-6 pb-28 text-center">
        <Reveal>
          <p className="text-2xl md:text-3xl font-semibold leading-snug">
            "זו לא עוד סוכנות.
            <br />
            זו פלטפורמת ניהול קריירה שיכולה להפוך לסטנדרט החדש."
          </p>
        </Reveal>
      </section>

      {/* Join CTA */}
      <section className="max-w-3xl mx-auto px-6 pb-28 text-center">
        <Reveal>
          <div className="lp-glass rounded-3xl p-10 md:p-14">
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight">מוכן לקחת שליטה על הקריירה שלך?</h2>
            <p className="mt-4" style={{ color: "var(--lp-muted)" }}>
              הפלטפורמה המלאה משיקה בקרוב. בנה את פרופיל השחקן שלך בפחות משתי דקות.
            </p>
            <button
              type="button"
              onClick={startOnboarding}
              className="lp-btn-gold rounded-full px-7 py-3 text-sm font-bold mt-8 inline-flex items-center gap-2 transition-shadow"
            >
              הצטרפות ל-SFG <ArrowLeft size={16} />
            </button>
          </div>
        </Reveal>
      </section>

      <footer className="border-t" style={{ borderColor: "var(--lp-glass-border)" }}>
        <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <Image src="/logo-icon.png" alt="SFG" width={24} height={24} className="rounded-md w-6 h-6" />
            <span className="text-sm font-semibold">
              SFG <span style={{ color: "var(--lp-gold)" }}>OS</span>
            </span>
          </div>
          <div className="text-xs" style={{ color: "var(--lp-muted)" }}>
            © {new Date().getFullYear()} SFG OS. מערכת הפעלה לקריירת כדורגל.
          </div>
        </div>
      </footer>
    </div>
  );
}
