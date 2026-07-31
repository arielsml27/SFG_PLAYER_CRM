"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Loader2, ShieldAlert } from "lucide-react";
import { saveQuestionnaireResponses } from "@/lib/actions";
import { QUESTIONNAIRE_SECTIONS, SCALES, TOTAL_QUESTION_COUNT, type Question } from "@/lib/extended-questionnaire";

const DRAFT_PREFIX = "sfg-questionnaire-draft-";

type Draft = {
  sectionIndex: number;
  answers: Record<string, string>;
};

function loadDraft(playerId: string): Draft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(DRAFT_PREFIX + playerId);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && parsed.answers) return parsed as Draft;
  } catch {
    // ignore corrupt draft
  }
  return null;
}

function saveDraft(playerId: string, draft: Draft) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(DRAFT_PREFIX + playerId, JSON.stringify(draft));
  } catch {
    // storage full or unavailable - not critical
  }
}

function clearDraft(playerId: string) {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(DRAFT_PREFIX + playerId);
}

function QuestionField({
  question,
  value,
  onChange,
}: {
  question: Question;
  value: string;
  onChange: (value: string) => void;
}) {
  if (question.type === "TEXTAREA") {
    return (
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="lp-input w-full"
        rows={2}
        placeholder={question.text}
      />
    );
  }
  if (question.type === "NUMBER") {
    return (
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="lp-input w-full"
        placeholder={question.text}
      />
    );
  }
  if (question.type === "DATE") {
    return <input type="date" value={value} onChange={(e) => onChange(e.target.value)} className="lp-input w-full" />;
  }
  if (question.type === "SELECT") {
    return (
      <select value={value} onChange={(e) => onChange(e.target.value)} className="lp-input w-full">
        <option value="">בחר</option>
        {(question.options ?? []).map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    );
  }
  if (question.type === "SCALE") {
    const options = SCALES[question.scale!];
    return (
      <select value={value} onChange={(e) => onChange(e.target.value)} className="lp-input w-full">
        <option value="">בחר</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    );
  }
  if (question.type === "MULTI_SELECT") {
    const selected = value ? value.split(", ").filter(Boolean) : [];
    const toggle = (opt: string) => {
      const next = selected.includes(opt) ? selected.filter((s) => s !== opt) : [...selected, opt];
      onChange(next.join(", "));
    };
    return (
      <div className="flex flex-wrap gap-2">
        {(question.options ?? []).map((o) => {
          const active = selected.includes(o);
          return (
            <button
              key={o}
              type="button"
              onClick={() => toggle(o)}
              className="rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors"
              style={
                active
                  ? { background: "var(--lp-gold)", color: "#1c1404" }
                  : { background: "rgba(255,255,255,0.06)", color: "var(--lp-muted)", border: "1px solid rgba(255,255,255,0.1)" }
              }
            >
              {o}
            </button>
          );
        })}
      </div>
    );
  }
  // TEXT
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="lp-input w-full"
      placeholder={question.text}
    />
  );
}

export default function ExtendedQuestionnaire({ playerId, firstName }: { playerId: string; firstName: string }) {
  const router = useRouter();
  const [sectionIndex, setSectionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showResumeBanner, setShowResumeBanner] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const draft = loadDraft(playerId);
    if (draft && Object.keys(draft.answers).length > 0) {
      setAnswers(draft.answers);
      setSectionIndex(draft.sectionIndex ?? 0);
      setShowResumeBanner(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (submitted) return;
    saveDraft(playerId, { sectionIndex, answers });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sectionIndex, answers, submitted]);

  const section = QUESTIONNAIRE_SECTIONS[sectionIndex];
  const isLast = sectionIndex === QUESTIONNAIRE_SECTIONS.length - 1;
  const answeredCount = useMemo(() => Object.values(answers).filter((v) => v && v.trim() !== "").length, [answers]);

  function update(questionId: string, value: string) {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  }

  function restart() {
    clearDraft(playerId);
    setAnswers({});
    setSectionIndex(0);
    setShowResumeBanner(false);
  }

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    try {
      const responses = QUESTIONNAIRE_SECTIONS.flatMap((s) =>
        s.questions
          .filter((q) => answers[q.id] && answers[q.id].trim() !== "")
          .map((q) => ({ sectionId: s.id, questionId: q.id, value: answers[q.id] }))
      );
      await saveQuestionnaireResponses(playerId, responses);
      clearDraft(playerId);
      setSubmitted(true);
    } catch (e) {
      console.error(e);
      setError("משהו השתבש בשליחת השאלון. נסה שוב.");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="lp-page min-h-screen flex items-center justify-center px-6 py-16" dir="rtl" lang="he">
        <div className="w-full max-w-lg text-center">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">תודה, {firstName}!</h1>
          <p className="mt-3" style={{ color: "var(--lp-muted)" }}>
            השאלון נשלח בהצלחה ונוסף לפרופיל שלך. הצוות שלנו יעבור עליו.
          </p>
          <button
            type="button"
            onClick={() => router.push(`/players/${playerId}`)}
            className="lp-btn-gold rounded-full px-6 py-2.5 text-sm font-bold mt-8 inline-flex items-center gap-2 transition-shadow"
          >
            קח אותי לפרופיל שלי <ArrowLeft size={15} />
          </button>
        </div>
      </div>
    );
  }

  let lastGroupLabel: string | undefined;

  return (
    <div className="lp-page min-h-screen px-6 py-16" dir="rtl" lang="he">
      <div className="w-full max-w-3xl mx-auto">
        <div
          className="rounded-2xl p-5 mb-6 flex items-start gap-3"
          style={{ background: "rgba(247,112,102,0.1)", border: "1px solid rgba(247,112,102,0.3)" }}
        >
          <ShieldAlert size={22} className="shrink-0 mt-0.5" style={{ color: "#f77066" }} />
          <div>
            <div className="font-bold text-base">אנחנו ממש לא סוכנים, יועצים מנטליים או בעלי עניין</div>
            <div className="text-sm mt-1" style={{ color: "var(--lp-fg)" }}>
              אנחנו רק מציגים דאטה ומכוונים לפעולה. השאלון נועד לבניית פרופיל מקצועי, לא לייעוץ אישי.
            </div>
          </div>
        </div>

        {showResumeBanner && (
          <div className="lp-glass rounded-2xl p-4 mb-6 flex items-center justify-between gap-4 flex-wrap">
            <div className="text-sm">
              נמצאה טיוטה שמורה, בחלק {sectionIndex + 1} מתוך {QUESTIONNAIRE_SECTIONS.length}. להמשיך משם?
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowResumeBanner(false)}
                className="lp-btn-gold rounded-full px-4 py-1.5 text-xs font-bold"
              >
                המשך מאיפה שהפסקתי
              </button>
              <button
                type="button"
                onClick={restart}
                className="lp-btn-glass rounded-full px-4 py-1.5 text-xs font-semibold"
              >
                התחל מחדש
              </button>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold">שאלון מקצועי מורחב</h1>
            <div className="text-xs mt-0.5" style={{ color: "var(--lp-muted)" }}>
              {answeredCount} תשובות מתוך {TOTAL_QUESTION_COUNT} נשמרו אוטומטית
            </div>
          </div>
          <div className="text-xs font-semibold" style={{ color: "var(--lp-muted)" }}>
            חלק {sectionIndex + 1} מתוך {QUESTIONNAIRE_SECTIONS.length}
          </div>
        </div>

        <div className="h-1.5 rounded-full mb-8 overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${((sectionIndex + 1) / QUESTIONNAIRE_SECTIONS.length) * 100}%`,
              background: "linear-gradient(135deg, var(--lp-gold-soft), var(--lp-gold))",
            }}
          />
        </div>

        <div key={sectionIndex} className="lp-glass rounded-3xl p-8 lp-fade-up">
          <h2 className="text-xl font-bold mb-1">{section.title}</h2>
          {section.note && (
            <p className="text-sm mb-5" style={{ color: "var(--lp-muted)" }}>
              {section.note}
            </p>
          )}
          <div className="space-y-4 mt-5">
            {section.questions.map((q) => {
              const showGroupLabel = q.groupLabel && q.groupLabel !== lastGroupLabel;
              if (q.groupLabel) lastGroupLabel = q.groupLabel;
              return (
                <div key={q.id}>
                  {showGroupLabel && (
                    <div className="text-xs font-bold uppercase tracking-wide mt-6 mb-3" style={{ color: "var(--lp-gold-soft)" }}>
                      {q.groupLabel}
                    </div>
                  )}
                  <div className="text-xs font-semibold mb-1.5" style={{ color: "var(--lp-muted)" }}>
                    {q.text}
                  </div>
                  <QuestionField question={q} value={answers[q.id] ?? ""} onChange={(v) => update(q.id, v)} />
                </div>
              );
            })}
          </div>

          {error && (
            <div className="mt-4 text-sm rounded-xl px-4 py-2.5" style={{ background: "rgba(247,112,102,0.12)", color: "#f77066" }}>
              {error}
            </div>
          )}

          <div className="flex items-center gap-3 mt-8">
            {sectionIndex > 0 && !submitting && (
              <button
                type="button"
                onClick={() => setSectionIndex((s) => s - 1)}
                className="lp-btn-glass rounded-full px-5 py-2.5 text-sm font-semibold transition-colors"
              >
                חזרה
              </button>
            )}
            <button
              type="button"
              disabled={submitting}
              onClick={() => (isLast ? handleSubmit() : setSectionIndex((s) => s + 1))}
              className="lp-btn-gold rounded-full px-6 py-2.5 text-sm font-bold flex-1 inline-flex items-center justify-center gap-2 transition-shadow disabled:opacity-40"
            >
              {submitting ? (
                <>
                  <Loader2 size={15} className="animate-spin" /> שולח...
                </>
              ) : (
                <>
                  {isLast ? "שלח שאלון" : "המשך"} <ArrowLeft size={15} />
                </>
              )}
            </button>
          </div>
          <div className="text-xs text-center mt-4" style={{ color: "var(--lp-muted)" }}>
            כל השאלות אופציונליות. אפשר לצאת ולחזור מאוחר יותר, הטיוטה נשמרת אוטומטית בדפדפן הזה.
          </div>
        </div>
      </div>
    </div>
  );
}
