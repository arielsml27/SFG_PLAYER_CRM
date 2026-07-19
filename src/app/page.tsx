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
  ArrowRight,
  PlayCircle,
} from "lucide-react";
import Reveal from "@/components/landing/Reveal";
import DashboardPreview from "@/components/landing/DashboardPreview";
import OnboardingWizard from "@/components/landing/OnboardingWizard";

const DEPARTMENTS = [
  {
    icon: Handshake,
    name: "Representation",
    description: "Contracts, negotiations and club relationships handled by dedicated advisors.",
  },
  {
    icon: Activity,
    name: "Performance",
    description: "Physical, mental and technical development tracked against a clear roadmap.",
  },
  {
    icon: Video,
    name: "Media",
    description: "Highlight reels, photoshoots and a personal brand built for scouts and sponsors.",
  },
  {
    icon: BadgeDollarSign,
    name: "Commercial",
    description: "Sponsorships and brand deals matched to the player's profile and market value.",
  },
  {
    icon: BarChart3,
    name: "Analytics",
    description: "One Career Score across every dimension of the player's development.",
  },
  {
    icon: Globe2,
    name: "International",
    description: "Trials, transfers and exposure across leagues and federations worldwide.",
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
    <div className="lp-page min-h-screen">
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
              Watch Demo
            </a>
            <button type="button" onClick={startOnboarding} className="lp-btn-gold rounded-full px-4 py-2 text-sm font-semibold transition-shadow">
              Join SFG
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-20 pb-16 text-center">
        <Reveal>
          <div className="inline-flex items-center gap-2 lp-glass rounded-full px-4 py-1.5 text-xs font-semibold mb-8" style={{ color: "var(--lp-gold-soft)" }}>
            Football Career Operating System
          </div>
        </Reveal>
        <Reveal delay={80}>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight leading-[1.1] max-w-4xl mx-auto">
            Manage Your Football Career.
            <br />
            <span className="lp-gold-text">All In One Place.</span>
          </h1>
        </Reveal>
        <Reveal delay={160}>
          <p className="mt-6 text-base md:text-lg max-w-2xl mx-auto" style={{ color: "var(--lp-muted)" }}>
            Representation, performance, media, commercial and analytics — unified in a single
            command center built for players, families and the professionals around them.
          </p>
        </Reveal>
        <Reveal delay={240}>
          <div className="mt-10 flex items-center justify-center gap-4 flex-wrap">
            <button
              type="button"
              onClick={startOnboarding}
              className="lp-btn-gold rounded-full px-6 py-3 text-sm font-bold inline-flex items-center gap-2 transition-shadow"
            >
              Join SFG as a Player <ArrowRight size={16} />
            </button>
            <a href="#preview" className="lp-btn-glass rounded-full px-6 py-3 text-sm font-semibold inline-flex items-center gap-2 transition-colors">
              <PlayCircle size={16} /> Watch Demo
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
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">One platform. Every department.</h2>
            <p className="mt-4 max-w-xl mx-auto" style={{ color: "var(--lp-muted)" }}>
              Every part of a football career, coordinated in one place instead of scattered
              across phone calls, spreadsheets and group chats.
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
            "It's not just another agency.
            <br />
            It's a Career Management platform that can become the new standard."
          </p>
        </Reveal>
      </section>

      {/* Join CTA */}
      <section className="max-w-3xl mx-auto px-6 pb-28 text-center">
        <Reveal>
          <div className="lp-glass rounded-3xl p-10 md:p-14">
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Ready to take control of your career?</h2>
            <p className="mt-4" style={{ color: "var(--lp-muted)" }}>
              The full platform is launching soon. Build your player profile in under two minutes.
            </p>
            <button
              type="button"
              onClick={startOnboarding}
              className="lp-btn-gold rounded-full px-7 py-3 text-sm font-bold mt-8 inline-flex items-center gap-2 transition-shadow"
            >
              Join SFG <ArrowRight size={16} />
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
            © {new Date().getFullYear()} SFG OS. Football Career Operating System.
          </div>
        </div>
      </footer>
    </div>
  );
}
