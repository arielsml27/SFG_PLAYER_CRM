"use client";

import { useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  User,
  Calendar,
  Crosshair,
  Building2,
  FileText,
  Target,
  Users,
  Video,
  UploadCloud,
  FileVideo,
  ImagePlus,
  Loader2,
  GraduationCap,
  Dumbbell,
} from "lucide-react";
import { registerPlayerPublic } from "@/lib/actions";
import { STRONG_FOOT_OPTIONS, TARGET_LEVELS, TARGET_LEVEL_LABELS, RELOCATE_OPTIONS, RELOCATE_LABELS } from "@/lib/constants";
import { EMPTY_PLAYER_DATA, ONBOARDING_STEPS, type PlayerData } from "./onboarding-types";
import PremiumUpsell from "./PremiumUpsell";

const POSITIONS = ["GK", "CB", "LB", "RB", "DM", "CM", "AM", "LW", "RW", "ST"];
const GOAL_OPTIONS = [
  "להתגלות על ידי מועדונים מקצועיים",
  "להבטיח מעבר לחו״ל",
  "לשפר ביצועים גופניים",
  "לבנות מותג אישי ונוכחות מדיה",
  "להגיע לנבחרת הלאומית",
];
const STEP_META = {
  name: { title: "מה השם שלך?", icon: User },
  birthBody: { title: "תאריך לידה, גובה ומשקל", icon: Calendar },
  position: { title: "מה העמדה שלך?", icon: Crosshair },
  clubBackground: { title: "המועדון והרקע הכדורגלני שלך", icon: Building2 },
  bio: { title: "ספר לנו על המשחק שלך", icon: FileText },
  habits: { title: "ההרגלים שלך", icon: Dumbbell },
  lifeBackground: { title: "קצת יותר עליך", icon: GraduationCap },
  goals: { title: "מה המטרות שלך?", icon: Target },
  familyLinks: { title: "משפחה וקישורים", icon: Users },
  video: { title: "תראה לנו מה יש לך", icon: Video },
};

function chipStyle(active: boolean): React.CSSProperties {
  return active
    ? { background: "var(--lp-gold)", color: "#1c1404" }
    : { background: "rgba(255,255,255,0.06)", color: "var(--lp-muted)", border: "1px solid rgba(255,255,255,0.1)" };
}

export default function OnboardingWizard({ onCancel }: { onCancel: () => void }) {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<PlayerData>(EMPTY_PLAYER_DATA);
  const [dragOver, setDragOver] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [registeredPlayer, setRegisteredPlayer] = useState<{ id: string; firstName: string } | null>(null);

  const photoInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const update = <K extends keyof PlayerData>(key: K, value: PlayerData[K]) =>
    setData((prev) => ({ ...prev, [key]: value }));

  const toggleFrom = (key: "secondaryPositions" | "goals", value: string) => {
    setData((prev) => ({
      ...prev,
      [key]: prev[key].includes(value) ? prev[key].filter((v) => v !== value) : [...prev[key], value],
    }));
  };

  const MAX_VIDEO_SECONDS = 30;

  function pickVideo(file: File) {
    setVideoError(null);
    const url = URL.createObjectURL(file);
    const probe = document.createElement("video");
    probe.preload = "metadata";
    probe.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      if (probe.duration > MAX_VIDEO_SECONDS + 0.5) {
        setVideoError(`הסרטון באורך ${Math.round(probe.duration)} שניות, אנא העלה קליפ של עד ${MAX_VIDEO_SECONDS} שניות.`);
        return;
      }
      update("video", file);
    };
    probe.onerror = () => {
      URL.revokeObjectURL(url);
      setVideoError("לא הצלחנו לקרוא את קובץ הווידאו. נסה קובץ אחר.");
    };
    probe.src = url;
  }

  const stepKey = ONBOARDING_STEPS[step];
  const isLast = step === ONBOARDING_STEPS.length - 1;

  const canContinue = (() => {
    switch (stepKey) {
      case "name":
        return data.firstName.trim() !== "" && data.lastName.trim() !== "" && data.email.trim() !== "" && data.phone.trim() !== "";
      case "birthBody":
        return data.dob !== "";
      case "position":
        return data.position !== null;
      case "clubBackground":
        return data.noClub || data.clubName.trim() !== "";
      case "goals":
        return data.goals.length > 0;
      default:
        return true;
    }
  })();

  const StepIcon = STEP_META[stepKey].icon;

  async function handleFinish() {
    setSubmitting(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.set("firstName", data.firstName);
      fd.set("lastName", data.lastName);
      fd.set("email", data.email);
      fd.set("phone", data.phone);
      if (data.photo) fd.set("photo", data.photo);
      fd.set("dateOfBirth", data.dob);
      fd.set("nationality", data.nationality);
      fd.set("secondNationality", data.secondNationality);
      fd.set("height", data.height);
      fd.set("weight", data.weight);
      fd.set("strongFoot", data.strongFoot);
      fd.set("mainPosition", data.position ?? "");
      fd.set("secondaryPositions", data.secondaryPositions.join(", "));
      fd.set("clubName", data.clubName);
      fd.set("noClub", data.noClub ? "on" : "");
      fd.set("currentLeague", data.currentLeague);
      fd.set("currentCountry", data.currentCountry);
      fd.set("startingPlace", data.startingPlace);
      fd.set("startingAge", data.startingAge);
      fd.set("previousClubs", data.previousClubs);
      fd.set("trainingFrequency", data.trainingFrequency);
      fd.set("playerComparison", data.playerComparison);
      fd.set("nutritionDiscipline", data.nutritionDiscipline);
      fd.set("extraTraining", data.extraTraining);
      fd.set("externalProfessionals", data.externalProfessionals);
      fd.set("familyFootballBackground", data.familyFootballBackground);
      fd.set("educationStatus", data.educationStatus);
      fd.set("languagesSpoken", data.languagesSpoken);
      fd.set("injuryHistory", data.injuryHistory);
      fd.set("willingToRelocate", data.willingToRelocate ?? "");
      fd.set("shortDescription", data.shortDescription);
      fd.set("strengths", data.strengths);
      fd.set("weaknesses", data.weaknesses);
      fd.set("playingStyle", data.playingStyle);
      fd.set("idealRole", data.idealRole);
      fd.set("targetLevel", data.targetLevel ?? "");
      fd.set("goals", data.goals.join(", "));
      fd.set("familyContactName", data.familyContactName);
      fd.set("familyContactPhone", data.familyContactPhone);
      fd.set("familyContactEmail", data.familyContactEmail);
      fd.set("address", data.address);
      fd.set("statsLink", data.statsLink);
      fd.set("socialLink", data.socialLink);
      if (data.video) fd.set("video", data.video);

      const { playerId } = await registerPlayerPublic(fd);
      setRegisteredPlayer({ id: playerId, firstName: data.firstName });
    } catch (e) {
      console.error(e);
      setError("משהו השתבש ביצירת הפרופיל. נסה שוב.");
      setSubmitting(false);
    }
  }

  if (registeredPlayer) {
    return <PremiumUpsell playerId={registeredPlayer.id} firstName={registeredPlayer.firstName} />;
  }

  return (
    <div className="lp-page min-h-screen flex items-center justify-center px-6 py-16" dir="rtl" lang="he">
      <div className="w-full max-w-2xl">
        <div className="flex items-center justify-between mb-6">
          <button
            type="button"
            onClick={onCancel}
            className="text-sm inline-flex items-center gap-1.5 hover:opacity-80 transition-opacity"
            style={{ color: "var(--lp-muted)" }}
          >
            <ArrowRight size={14} /> חזרה לדף הבית
          </button>
          <div className="text-xs font-semibold" style={{ color: "var(--lp-muted)" }}>
            שלב {step + 1} מתוך {ONBOARDING_STEPS.length}
          </div>
        </div>

        <div className="h-1.5 rounded-full mb-8 overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${((step + 1) / ONBOARDING_STEPS.length) * 100}%`,
              background: "linear-gradient(135deg, var(--lp-gold-soft), var(--lp-gold))",
            }}
          />
        </div>

        <div key={step} className="lp-glass rounded-3xl p-8 lp-fade-up">
          <div className="flex items-center gap-3 mb-6">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: "rgba(227,181,99,0.12)", color: "var(--lp-gold)" }}
            >
              <StepIcon size={18} />
            </div>
            <h2 className="text-xl font-bold">{STEP_META[stepKey].title}</h2>
          </div>

          {stepKey === "name" && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  placeholder="שם פרטי"
                  value={data.firstName}
                  onChange={(e) => update("firstName", e.target.value)}
                  className="lp-input flex-1"
                />
                <input
                  type="text"
                  placeholder="שם משפחה"
                  value={data.lastName}
                  onChange={(e) => update("lastName", e.target.value)}
                  className="lp-input flex-1"
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="email"
                  placeholder="אימייל"
                  value={data.email}
                  onChange={(e) => update("email", e.target.value)}
                  className="lp-input flex-1"
                />
                <input
                  type="tel"
                  placeholder="טלפון"
                  value={data.phone}
                  onChange={(e) => update("phone", e.target.value)}
                  className="lp-input flex-1"
                />
              </div>
              <input
                ref={photoInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => update("photo", e.target.files?.[0] ?? null)}
              />
              <button
                type="button"
                onClick={() => photoInputRef.current?.click()}
                className="lp-btn-glass rounded-full px-4 py-2 text-xs font-semibold inline-flex items-center gap-2"
              >
                <ImagePlus size={14} />
                {data.photo ? data.photo.name : "הוסף תמונת פרופיל (אופציונלי)"}
              </button>
            </div>
          )}

          {stepKey === "birthBody" && (
            <div className="space-y-4">
              <input type="date" value={data.dob} onChange={(e) => update("dob", e.target.value)} className="lp-input w-full" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="אזרחות (אופציונלי)"
                  value={data.nationality}
                  onChange={(e) => update("nationality", e.target.value)}
                  className="lp-input"
                />
                <input
                  type="text"
                  placeholder="אזרחות נוספת (אופציונלי)"
                  value={data.secondNationality}
                  onChange={(e) => update("secondNationality", e.target.value)}
                  className="lp-input"
                />
                <input
                  type="number"
                  placeholder="גובה (ס״מ)"
                  value={data.height}
                  onChange={(e) => update("height", e.target.value)}
                  className="lp-input"
                />
                <input
                  type="number"
                  placeholder="משקל (ק״ג)"
                  value={data.weight}
                  onChange={(e) => update("weight", e.target.value)}
                  className="lp-input"
                />
              </div>
              <div>
                <div className="text-xs font-semibold mb-2" style={{ color: "var(--lp-muted)" }}>
                  רגל חזקה
                </div>
                <div className="flex flex-wrap gap-2">
                  {STRONG_FOOT_OPTIONS.map((f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => update("strongFoot", f)}
                      className="rounded-full px-4 py-2 text-xs font-semibold transition-colors"
                      style={chipStyle(data.strongFoot === f)}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {stepKey === "position" && (
            <div className="space-y-5">
              <div>
                <div className="text-xs font-semibold mb-2" style={{ color: "var(--lp-muted)" }}>
                  עמדה ראשית
                </div>
                <div className="grid grid-cols-5 gap-2">
                  {POSITIONS.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => update("position", p)}
                      className="rounded-xl py-2.5 text-sm font-bold transition-colors"
                      style={chipStyle(data.position === p)}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-xs font-semibold mb-2" style={{ color: "var(--lp-muted)" }}>
                  נוח גם בעמדות הבאות (אופציונלי)
                </div>
                <div className="flex flex-wrap gap-2">
                  {POSITIONS.filter((p) => p !== data.position).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => toggleFrom("secondaryPositions", p)}
                      className="rounded-full px-3.5 py-1.5 text-xs font-bold transition-colors"
                      style={chipStyle(data.secondaryPositions.includes(p))}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {stepKey === "clubBackground" && (
            <div className="space-y-3">
              <input
                type="text"
                placeholder="מועדון נוכחי"
                value={data.clubName}
                disabled={data.noClub}
                onChange={(e) => update("clubName", e.target.value)}
                className="lp-input w-full disabled:opacity-40"
              />
              <label className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: "var(--lp-muted)" }}>
                <input
                  type="checkbox"
                  checked={data.noClub}
                  onChange={(e) => {
                    update("noClub", e.target.checked);
                    if (e.target.checked) update("clubName", "");
                  }}
                />
                אני לא רשום כרגע במועדון
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="ליגה (אופציונלי)"
                  value={data.currentLeague}
                  onChange={(e) => update("currentLeague", e.target.value)}
                  className="lp-input"
                />
                <input
                  type="text"
                  placeholder="מדינה (אופציונלי)"
                  value={data.currentCountry}
                  onChange={(e) => update("currentCountry", e.target.value)}
                  className="lp-input"
                />
                <input
                  type="text"
                  placeholder="היכן התחלת לשחק כדורגל (מועדון / מקום)"
                  value={data.startingPlace}
                  onChange={(e) => update("startingPlace", e.target.value)}
                  className="lp-input"
                />
                <input
                  type="number"
                  placeholder="באיזה גיל התחלת לשחק"
                  value={data.startingAge}
                  onChange={(e) => update("startingAge", e.target.value)}
                  className="lp-input"
                />
              </div>
              <input
                type="text"
                placeholder="מועדונים קודמים (אם יש, אופציונלי)"
                value={data.previousClubs}
                onChange={(e) => update("previousClubs", e.target.value)}
                className="lp-input w-full"
              />
            </div>
          )}

          {stepKey === "habits" && (
            <div className="space-y-3">
              <textarea
                placeholder="משמעת מבחינת תזונה"
                value={data.nutritionDiscipline}
                onChange={(e) => update("nutritionDiscipline", e.target.value)}
                className="lp-input w-full"
                rows={2}
              />
              <input
                type="text"
                placeholder="מספר יחידות אימון בשבוע"
                value={data.trainingFrequency}
                onChange={(e) => update("trainingFrequency", e.target.value)}
                className="lp-input w-full"
              />
              <textarea
                placeholder="האם אתה מתאמן מחוץ למסגרת הקבוצה? אם כן, במה"
                value={data.extraTraining}
                onChange={(e) => update("extraTraining", e.target.value)}
                className="lp-input w-full"
                rows={2}
              />
              <textarea
                placeholder="האם אתה נעזר באנשי מקצוע מחוץ למסגרת הכדורגל (תזונאי, מאמן מנטלי, פיזיותרפיסט וכו')? אם כן, אילו"
                value={data.externalProfessionals}
                onChange={(e) => update("externalProfessionals", e.target.value)}
                className="lp-input w-full"
                rows={2}
              />
            </div>
          )}

          {stepKey === "bio" && (
            <div className="space-y-3">
              <textarea
                placeholder="תיאור קצר שלך כשחקן (אופציונלי)"
                value={data.shortDescription}
                onChange={(e) => update("shortDescription", e.target.value)}
                className="lp-input w-full"
                rows={2}
              />
              <div className="flex flex-col sm:flex-row gap-3">
                <textarea
                  placeholder="החוזקות שלך (אופציונלי)"
                  value={data.strengths}
                  onChange={(e) => update("strengths", e.target.value)}
                  className="lp-input flex-1"
                  rows={2}
                />
                <textarea
                  placeholder="על מה אתה עובד לשיפור (אופציונלי)"
                  value={data.weaknesses}
                  onChange={(e) => update("weaknesses", e.target.value)}
                  className="lp-input flex-1"
                  rows={2}
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  placeholder="סגנון משחק (אופציונלי)"
                  value={data.playingStyle}
                  onChange={(e) => update("playingStyle", e.target.value)}
                  className="lp-input flex-1"
                />
                <input
                  type="text"
                  placeholder="התפקיד האידיאלי (אופציונלי)"
                  value={data.idealRole}
                  onChange={(e) => update("idealRole", e.target.value)}
                  className="lp-input flex-1"
                />
              </div>
              <input
                type="text"
                placeholder="לאיזה שחקן אתה הכי דומה בסגנון המשחק שלך (אופציונלי)"
                value={data.playerComparison}
                onChange={(e) => update("playerComparison", e.target.value)}
                className="lp-input w-full"
              />
              <div>
                <div className="text-xs font-semibold mb-2" style={{ color: "var(--lp-muted)" }}>
                  רמת יעד (אופציונלי)
                </div>
                <div className="flex flex-wrap gap-2">
                  {TARGET_LEVELS.map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => update("targetLevel", data.targetLevel === value ? null : value)}
                      className="rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors"
                      style={chipStyle(data.targetLevel === value)}
                    >
                      {TARGET_LEVEL_LABELS[value]}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {stepKey === "lifeBackground" && (
            <div className="space-y-3">
              <input
                type="text"
                placeholder="האם מישהו מהמשפחה שלך שיחק כדורגל ברמה מקצועית? (אופציונלי)"
                value={data.familyFootballBackground}
                onChange={(e) => update("familyFootballBackground", e.target.value)}
                className="lp-input w-full"
              />
              <input
                type="text"
                placeholder="איך אתה בלימודים? (למשל: תיכון כיתה יא, סטודנט, סיים לימודים)"
                value={data.educationStatus}
                onChange={(e) => update("educationStatus", e.target.value)}
                className="lp-input w-full"
              />
              <input
                type="text"
                placeholder="אילו שפות אתה דובר? (אופציונלי)"
                value={data.languagesSpoken}
                onChange={(e) => update("languagesSpoken", e.target.value)}
                className="lp-input w-full"
              />
              <textarea
                placeholder="האם היו לך פציעות משמעותיות בעבר? (אופציונלי)"
                value={data.injuryHistory}
                onChange={(e) => update("injuryHistory", e.target.value)}
                className="lp-input w-full"
                rows={2}
              />
              <div>
                <div className="text-xs font-semibold mb-2" style={{ color: "var(--lp-muted)" }}>
                  פתוח לעבור למדינה אחרת למען הקריירה? (אופציונלי)
                </div>
                <div className="flex flex-wrap gap-2">
                  {RELOCATE_OPTIONS.map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => update("willingToRelocate", data.willingToRelocate === value ? null : value)}
                      className="rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors"
                      style={chipStyle(data.willingToRelocate === value)}
                    >
                      {RELOCATE_LABELS[value]}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {stepKey === "goals" && (
            <div className="flex flex-wrap gap-2">
              {GOAL_OPTIONS.map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => toggleFrom("goals", g)}
                  className="rounded-full px-4 py-2 text-xs font-semibold transition-colors text-right"
                  style={chipStyle(data.goals.includes(g))}
                >
                  {g}
                </button>
              ))}
            </div>
          )}

          {stepKey === "familyLinks" && (
            <div className="space-y-3">
              <div className="text-xs" style={{ color: "var(--lp-muted)" }}>
                אופציונלי: הוסף הורה או אפוטרופוס אם אתה מתחת לגיל 18.
              </div>
              <input
                type="text"
                placeholder="שם איש הקשר"
                value={data.familyContactName}
                onChange={(e) => update("familyContactName", e.target.value)}
                className="lp-input w-full"
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="tel"
                  placeholder="טלפון"
                  value={data.familyContactPhone}
                  onChange={(e) => update("familyContactPhone", e.target.value)}
                  className="lp-input"
                />
                <input
                  type="email"
                  placeholder="אימייל"
                  value={data.familyContactEmail}
                  onChange={(e) => update("familyContactEmail", e.target.value)}
                  className="lp-input"
                />
              </div>
              <input
                type="text"
                placeholder="כתובת מגורים (אופציונלי)"
                value={data.address}
                onChange={(e) => update("address", e.target.value)}
                className="lp-input w-full"
              />
              <div className="text-xs pt-1" style={{ color: "var(--lp-muted)" }}>
                אופציונלי: פרופיל סטטיסטיקות (Transfermarkt, SofaScore, Wyscout...) או חשבון רשת חברתית.
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="url"
                  placeholder="קישור לפרופיל סטטיסטיקות"
                  value={data.statsLink}
                  onChange={(e) => update("statsLink", e.target.value)}
                  className="lp-input"
                />
                <input
                  type="url"
                  placeholder="קישור לרשת חברתית"
                  value={data.socialLink}
                  onChange={(e) => update("socialLink", e.target.value)}
                  className="lp-input"
                />
              </div>
            </div>
          )}

          {stepKey === "video" && (
            <div>
              <input
                ref={videoInputRef}
                type="file"
                accept="video/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) pickVideo(file);
                }}
              />
              <div
                onClick={() => videoInputRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  const file = e.dataTransfer.files?.[0];
                  if (file) pickVideo(file);
                }}
                className="rounded-2xl p-8 text-center cursor-pointer transition-colors"
                style={{
                  border: `1.5px dashed ${dragOver ? "var(--lp-gold)" : "rgba(255,255,255,0.16)"}`,
                  background: dragOver ? "rgba(227,181,99,0.06)" : "rgba(255,255,255,0.02)",
                }}
              >
                {data.video ? (
                  <div className="flex flex-col items-center gap-2">
                    <FileVideo size={28} style={{ color: "var(--lp-gold)" }} />
                    <div className="text-sm font-semibold">{data.video.name}</div>
                    <div className="text-xs" style={{ color: "var(--lp-muted)" }}>
                      לחץ להחלפה
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <UploadCloud size={28} style={{ color: "var(--lp-muted)" }} />
                    <div className="text-sm font-semibold">גרור ושחרר את סרטון ההייליטס שלך</div>
                    <div className="text-xs" style={{ color: "var(--lp-muted)" }}>
                      או לחץ לבחירה, עד {MAX_VIDEO_SECONDS} שניות
                    </div>
                  </div>
                )}
              </div>
              {videoError && (
                <div className="mt-3 text-sm rounded-xl px-4 py-2.5" style={{ background: "rgba(247,112,102,0.12)", color: "#f77066" }}>
                  {videoError}
                </div>
              )}
              <div className="text-xs text-center mt-3" style={{ color: "var(--lp-muted)" }}>
                תוכל להוסיף זאת גם מאוחר יותר, זה לא ימנע ממך לסיים. הסרטון חייב להיות עד {MAX_VIDEO_SECONDS} שניות.
              </div>
            </div>
          )}

          {error && (
            <div className="mt-4 text-sm rounded-xl px-4 py-2.5" style={{ background: "rgba(247,112,102,0.12)", color: "#f77066" }}>
              {error}
            </div>
          )}

          <div className="flex items-center gap-3 mt-8">
            {step > 0 && !submitting && (
              <button
                type="button"
                onClick={() => setStep((s) => s - 1)}
                className="lp-btn-glass rounded-full px-5 py-2.5 text-sm font-semibold transition-colors"
              >
                חזרה
              </button>
            )}
            <button
              type="button"
              disabled={!canContinue || submitting}
              onClick={() => (isLast ? handleFinish() : setStep((s) => s + 1))}
              className="lp-btn-gold rounded-full px-6 py-2.5 text-sm font-bold flex-1 inline-flex items-center justify-center gap-2 transition-shadow disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
            >
              {submitting ? (
                <>
                  <Loader2 size={15} className="animate-spin" /> יוצר את הפרופיל שלך...
                </>
              ) : (
                <>
                  {isLast ? "סיום" : "המשך"} <ArrowLeft size={15} />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
