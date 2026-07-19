"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  User,
  Calendar,
  Ruler,
  Crosshair,
  Building2,
  FileText,
  Target,
  Users,
  Link2,
  Video,
  UploadCloud,
  FileVideo,
  ImagePlus,
  Loader2,
} from "lucide-react";
import { registerPlayerPublic } from "@/lib/actions";
import { EMPTY_PLAYER_DATA, ONBOARDING_STEPS, type PlayerData } from "./onboarding-types";

const POSITIONS = ["GK", "CB", "LB", "RB", "DM", "CM", "AM", "LW", "RW", "ST"];
const STRONG_FOOT_OPTIONS = ["Right", "Left", "Both"];
const TARGET_LEVELS: [string, string][] = [
  ["ISRAEL", "Israel"],
  ["SERBIA", "Serbia"],
  ["EUROPE", "Europe"],
  ["USA", "USA"],
  ["ACADEMY", "Academy"],
  ["SENIOR", "Senior / first team"],
];
const GOAL_OPTIONS = [
  "Get scouted by professional clubs",
  "Secure a transfer abroad",
  "Improve physical performance",
  "Build my personal brand & media presence",
  "Make the national team",
];

const STEP_META = {
  name: { title: "What's your name?", icon: User },
  birth: { title: "When were you born?", icon: Calendar },
  body: { title: "Your physical profile", icon: Ruler },
  position: { title: "What's your position?", icon: Crosshair },
  club: { title: "Which club are you with?", icon: Building2 },
  bio: { title: "Tell us about your game", icon: FileText },
  goals: { title: "What are your goals?", icon: Target },
  family: { title: "Family / guardian contact", icon: Users },
  links: { title: "Add your links", icon: Link2 },
  video: { title: "Show us what you've got", icon: Video },
};

function chipStyle(active: boolean): React.CSSProperties {
  return active
    ? { background: "var(--lp-gold)", color: "#1c1404" }
    : { background: "rgba(255,255,255,0.06)", color: "var(--lp-muted)", border: "1px solid rgba(255,255,255,0.1)" };
}

export default function OnboardingWizard({ onCancel }: { onCancel: () => void }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [data, setData] = useState<PlayerData>(EMPTY_PLAYER_DATA);
  const [dragOver, setDragOver] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [videoError, setVideoError] = useState<string | null>(null);

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
        setVideoError(`Video is ${Math.round(probe.duration)}s — please upload a clip of ${MAX_VIDEO_SECONDS} seconds or less.`);
        return;
      }
      update("video", file);
    };
    probe.onerror = () => {
      URL.revokeObjectURL(url);
      setVideoError("Couldn't read that video file. Try a different one.");
    };
    probe.src = url;
  }

  const stepKey = ONBOARDING_STEPS[step];
  const isLast = step === ONBOARDING_STEPS.length - 1;

  const canContinue = (() => {
    switch (stepKey) {
      case "name":
        return data.firstName.trim() !== "" && data.lastName.trim() !== "" && data.email.trim() !== "" && data.phone.trim() !== "";
      case "birth":
        return data.dob !== "";
      case "position":
        return data.position !== null;
      case "club":
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
      router.push(`/crm/players/${playerId}`);
    } catch (e) {
      console.error(e);
      setError("Something went wrong creating your profile. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <div className="lp-page min-h-screen flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-lg">
        <div className="flex items-center justify-between mb-6">
          <button
            type="button"
            onClick={onCancel}
            className="text-sm inline-flex items-center gap-1.5 hover:opacity-80 transition-opacity"
            style={{ color: "var(--lp-muted)" }}
          >
            <ArrowLeft size={14} /> Back to home
          </button>
          <div className="text-xs font-semibold" style={{ color: "var(--lp-muted)" }}>
            Step {step + 1} of {ONBOARDING_STEPS.length}
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
                  placeholder="First name"
                  value={data.firstName}
                  onChange={(e) => update("firstName", e.target.value)}
                  className="lp-input flex-1"
                />
                <input
                  type="text"
                  placeholder="Last name"
                  value={data.lastName}
                  onChange={(e) => update("lastName", e.target.value)}
                  className="lp-input flex-1"
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="email"
                  placeholder="Email"
                  value={data.email}
                  onChange={(e) => update("email", e.target.value)}
                  className="lp-input flex-1"
                />
                <input
                  type="tel"
                  placeholder="Phone"
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
                {data.photo ? data.photo.name : "Add a profile photo (optional)"}
              </button>
            </div>
          )}

          {stepKey === "birth" && (
            <div className="space-y-3">
              <input type="date" value={data.dob} onChange={(e) => update("dob", e.target.value)} className="lp-input w-full" />
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  placeholder="Nationality (optional)"
                  value={data.nationality}
                  onChange={(e) => update("nationality", e.target.value)}
                  className="lp-input flex-1"
                />
                <input
                  type="text"
                  placeholder="Second nationality (optional)"
                  value={data.secondNationality}
                  onChange={(e) => update("secondNationality", e.target.value)}
                  className="lp-input flex-1"
                />
              </div>
            </div>
          )}

          {stepKey === "body" && (
            <div className="space-y-4">
              <div className="flex gap-3">
                <input
                  type="number"
                  placeholder="Height (cm)"
                  value={data.height}
                  onChange={(e) => update("height", e.target.value)}
                  className="lp-input flex-1"
                />
                <input
                  type="number"
                  placeholder="Weight (kg)"
                  value={data.weight}
                  onChange={(e) => update("weight", e.target.value)}
                  className="lp-input flex-1"
                />
              </div>
              <div>
                <div className="text-xs font-semibold mb-2" style={{ color: "var(--lp-muted)" }}>
                  Strong foot
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
                  Main position
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
                  Also comfortable at (optional)
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

          {stepKey === "club" && (
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Current club"
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
                I'm not currently registered with a club
              </label>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  placeholder="League (optional)"
                  value={data.currentLeague}
                  onChange={(e) => update("currentLeague", e.target.value)}
                  className="lp-input flex-1"
                />
                <input
                  type="text"
                  placeholder="Country (optional)"
                  value={data.currentCountry}
                  onChange={(e) => update("currentCountry", e.target.value)}
                  className="lp-input flex-1"
                />
              </div>
            </div>
          )}

          {stepKey === "bio" && (
            <div className="space-y-3">
              <textarea
                placeholder="Short description of you as a player (optional)"
                value={data.shortDescription}
                onChange={(e) => update("shortDescription", e.target.value)}
                className="lp-input w-full"
                rows={2}
              />
              <div className="flex flex-col sm:flex-row gap-3">
                <textarea
                  placeholder="Your strengths (optional)"
                  value={data.strengths}
                  onChange={(e) => update("strengths", e.target.value)}
                  className="lp-input flex-1"
                  rows={2}
                />
                <textarea
                  placeholder="What you're working on (optional)"
                  value={data.weaknesses}
                  onChange={(e) => update("weaknesses", e.target.value)}
                  className="lp-input flex-1"
                  rows={2}
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  placeholder="Playing style (optional)"
                  value={data.playingStyle}
                  onChange={(e) => update("playingStyle", e.target.value)}
                  className="lp-input flex-1"
                />
                <input
                  type="text"
                  placeholder="Ideal role (optional)"
                  value={data.idealRole}
                  onChange={(e) => update("idealRole", e.target.value)}
                  className="lp-input flex-1"
                />
              </div>
              <div>
                <div className="text-xs font-semibold mb-2" style={{ color: "var(--lp-muted)" }}>
                  Target level (optional)
                </div>
                <div className="flex flex-wrap gap-2">
                  {TARGET_LEVELS.map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => update("targetLevel", data.targetLevel === value ? null : value)}
                      className="rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors"
                      style={chipStyle(data.targetLevel === value)}
                    >
                      {label}
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
                  className="rounded-full px-4 py-2 text-xs font-semibold transition-colors text-left"
                  style={chipStyle(data.goals.includes(g))}
                >
                  {g}
                </button>
              ))}
            </div>
          )}

          {stepKey === "family" && (
            <div className="space-y-3">
              <div className="text-xs" style={{ color: "var(--lp-muted)" }}>
                Optional — add a parent or guardian if you're under 18.
              </div>
              <input
                type="text"
                placeholder="Contact name"
                value={data.familyContactName}
                onChange={(e) => update("familyContactName", e.target.value)}
                className="lp-input w-full"
              />
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="tel"
                  placeholder="Phone"
                  value={data.familyContactPhone}
                  onChange={(e) => update("familyContactPhone", e.target.value)}
                  className="lp-input flex-1"
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={data.familyContactEmail}
                  onChange={(e) => update("familyContactEmail", e.target.value)}
                  className="lp-input flex-1"
                />
              </div>
              <input
                type="text"
                placeholder="Home address (optional)"
                value={data.address}
                onChange={(e) => update("address", e.target.value)}
                className="lp-input w-full"
              />
            </div>
          )}

          {stepKey === "links" && (
            <div className="space-y-3">
              <div className="text-xs" style={{ color: "var(--lp-muted)" }}>
                Optional — a stats profile (Transfermarkt, SofaScore, Wyscout...) or a social account.
              </div>
              <input
                type="url"
                placeholder="Stats profile link"
                value={data.statsLink}
                onChange={(e) => update("statsLink", e.target.value)}
                className="lp-input w-full"
              />
              <input
                type="url"
                placeholder="Social media link"
                value={data.socialLink}
                onChange={(e) => update("socialLink", e.target.value)}
                className="lp-input w-full"
              />
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
                      click to replace
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <UploadCloud size={28} style={{ color: "var(--lp-muted)" }} />
                    <div className="text-sm font-semibold">Drag & drop your highlight video</div>
                    <div className="text-xs" style={{ color: "var(--lp-muted)" }}>
                      or click to browse — up to {MAX_VIDEO_SECONDS} seconds
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
                You can add this later — it won't stop you from finishing. Clips must be {MAX_VIDEO_SECONDS} seconds or less.
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
                Back
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
                  <Loader2 size={15} className="animate-spin" /> Creating your profile...
                </>
              ) : (
                <>
                  {isLast ? "Finish" : "Continue"} <ArrowRight size={15} />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
