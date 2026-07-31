import Image from "next/image";
import { notFound } from "next/navigation";
import { getPlayerDetail } from "@/lib/data";
import { formatDate, calcAge } from "@/lib/format";
import { buildAttributeRadarData, buildAllAttributesData, summarizePlayerScouting } from "@/lib/scouting";
import { guessPositionGroup, TARGET_LEVEL_LABELS, RELOCATE_LABELS, REPRESENTATION_STATUS_LABELS } from "@/lib/constants";
import AttributeRadar from "@/components/AttributeRadar";
import AttributeBarChart from "@/components/AttributeBarChart";
import ProfessionalReferralButton from "@/components/landing/ProfessionalReferralButton";
import { Globe2, Link2, PlayCircle, MapPin, GraduationCap, Users, Dumbbell } from "lucide-react";

function completeness(player: any, linkCount: number, videoCount: number, hasReport: boolean) {
  const checks = [
    player.photoPath,
    player.shortDescription,
    player.strengths,
    player.playingStyle,
    player.idealRole,
    player.targetLevel,
    player.nationality,
    player.height,
    player.weight,
    player.strongFoot,
    player.secondaryPositions,
    player.currentClubId,
    player.currentLeague,
    player.startingPlace,
    player.startingAge,
    player.previousClubs,
    player.playerComparison,
    player.trainingFrequency,
    player.familyFootballBackground,
    player.languagesSpoken,
    player.educationStatus,
    player.willingToRelocate,
    linkCount > 0,
    videoCount > 0,
    hasReport,
  ];
  const filled = checks.filter(Boolean).length;
  return Math.round((filled / checks.length) * 100);
}

export default async function PublicPlayerProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const detail = await getPlayerDetail(id);
  if (!detail) notFound();

  const { player, club, links, videos, contracts, representation } = detail;
  const positionGroup = detail.scoutingReport?.positionGroup ?? guessPositionGroup(player.mainPosition);
  const allAttributes = detail.scoutingReport ? buildAllAttributesData(detail.scoutingReport, positionGroup) : [];
  const { strengths } = detail.scoutingReport ? summarizePlayerScouting(allAttributes) : { strengths: [] as any[] };
  const pct = completeness(player, links.length, videos.length, Boolean(detail.scoutingReport));
  const activeContract = contracts.find((c: any) => c.status === "ACTIVE") ?? contracts[0];
  const secondaryPositions = player.secondaryPositions
    ? String(player.secondaryPositions)
        .split(",")
        .map((s: string) => s.trim())
        .filter(Boolean)
    : [];

  const personalRows = (
    [
      ["לאום", player.nationality],
      ["אזרחות נוספת", player.secondNationality],
      ["גובה", player.height ? `${player.height} ס״מ` : null],
      ["משקל", player.weight ? `${player.weight} ק״ג` : null],
      ["רגל חזקה", player.strongFoot],
      ["שפות מדוברות", player.languagesSpoken],
      ["מצב לימודים", player.educationStatus],
      ["רקע כדורגל מקצועני במשפחה", player.familyFootballBackground],
      ["פתוח לעבור למדינה אחרת", player.willingToRelocate ? RELOCATE_LABELS[player.willingToRelocate] ?? player.willingToRelocate : null],
    ] as [string, any][]
  ).filter(([, v]) => v);

  const backgroundRows = (
    [
      ["היכן התחיל לשחק כדורגל", player.startingPlace],
      ["גיל תחילת המשחק", player.startingAge],
      ["מועדונים קודמים", player.previousClubs],
      ["תדירות אימונים", player.trainingFrequency],
      ["שחקן להשוואה בסגנון המשחק", player.playerComparison],
      ["משמעת מבחינת תזונה", player.nutritionDiscipline],
      ["מתאמן מחוץ למסגרת הקבוצה", player.extraTraining],
    ] as [string, any][]
  ).filter(([, v]) => v);

  return (
    <div className="lp-page min-h-screen px-6 py-16" dir="rtl" lang="he">
      <div className="w-full max-w-4xl mx-auto">
        {/* Header */}
        <div className="lp-glass rounded-3xl p-7 flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <div
            className="w-28 h-28 rounded-full overflow-hidden shrink-0 flex items-center justify-center border-2"
            style={{ borderColor: "var(--lp-gold)", background: "rgba(255,255,255,0.04)" }}
          >
            {player.photoPath ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={player.photoPath} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-2xl font-bold" style={{ color: "var(--lp-gold)" }}>
                {player.firstName?.[0]}
                {player.lastName?.[0]}
              </span>
            )}
          </div>
          <div className="flex-1 text-center sm:text-right">
            <h1 className="text-2xl font-bold">
              {player.firstName} {player.lastName}
            </h1>
            <div className="text-sm mt-1" style={{ color: "var(--lp-muted)" }}>
              גיל {calcAge(player.dateOfBirth)} · {player.mainPosition}
              {secondaryPositions.length > 0 ? ` (גם ${secondaryPositions.join(", ")})` : ""}
              {club ? ` · ${club.name}` : ""}
              {player.currentCountry ? ` · ${player.currentCountry}` : ""}
            </div>
            {player.shortDescription && <p className="text-sm mt-3 max-w-lg">{player.shortDescription}</p>}
          </div>
          <div className="text-center shrink-0">
            <div className="relative w-16 h-16">
              <svg viewBox="0 0 64 64" className="w-16 h-16 -rotate-90">
                <circle cx="32" cy="32" r="27" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="6" />
                <circle
                  cx="32"
                  cy="32"
                  r="27"
                  fill="none"
                  stroke="var(--lp-gold)"
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 27}
                  strokeDashoffset={2 * Math.PI * 27 * (1 - pct / 100)}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center text-xs font-bold">{pct}%</div>
            </div>
            <div className="text-[11px] mt-1" style={{ color: "var(--lp-muted)" }}>
              פרופיל שלם
            </div>
          </div>
        </div>

        {/* Contract & representation status */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
          <div className="lp-glass rounded-2xl p-4 text-center">
            <div className="text-xs" style={{ color: "var(--lp-muted)" }}>
              מועדון נוכחי
            </div>
            <div className="font-bold mt-1">{club?.name ?? "סוכן חופשי"}</div>
          </div>
          <div className="lp-glass rounded-2xl p-4 text-center">
            <div className="text-xs" style={{ color: "var(--lp-muted)" }}>
              בחוזה עד
            </div>
            <div className="font-bold mt-1">{activeContract ? formatDate(activeContract.endDate) : "לא זמין"}</div>
          </div>
          <div className="lp-glass rounded-2xl p-4 text-center">
            <div className="text-xs" style={{ color: "var(--lp-muted)" }}>
              סטטוס ייצוג
            </div>
            <div className="font-bold mt-1">
              {representation[0] ? REPRESENTATION_STATUS_LABELS[representation[0].status] ?? representation[0].status : "ללא ייצוג"}
            </div>
          </div>
        </div>

        {personalRows.length > 0 && (
          <Section title="פרטים אישיים" icon={Users}>
            <RowGrid rows={personalRows} />
          </Section>
        )}

        {backgroundRows.length > 0 && (
          <Section title="רקע כדורגלני והרגלים" icon={Dumbbell}>
            <RowGrid rows={backgroundRows} />
          </Section>
        )}

        {(player.strengths || player.playingStyle || player.idealRole || player.targetLevel) && (
          <Section title="פרופיל מקצועי" icon={GraduationCap}>
            <RowGrid
              rows={
                [
                  ["חוזקות", player.strengths],
                  ["סגנון משחק", player.playingStyle],
                  ["תפקיד אידיאלי", player.idealRole],
                  ["רמת יעד", player.targetLevel ? TARGET_LEVEL_LABELS[player.targetLevel] ?? player.targetLevel : null],
                ].filter(([, v]) => v) as [string, any][]
              }
            />
          </Section>
        )}

        {(links.length > 0 || videos.length > 0) && (
          <Section title="לינקים וסרטונים" icon={Link2}>
            <div className="flex flex-wrap gap-2">
              {links.map((l: any) => (
                <a
                  key={l.id}
                  href={l.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="lp-btn-glass rounded-full px-4 py-2 text-xs font-semibold inline-flex items-center gap-1.5"
                >
                  <Globe2 size={13} /> {l.title}
                </a>
              ))}
              {videos.map((v: any) => (
                <a
                  key={v.id}
                  href={v.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="lp-btn-glass rounded-full px-4 py-2 text-xs font-semibold inline-flex items-center gap-1.5"
                >
                  <PlayCircle size={13} /> {v.title}
                </a>
              ))}
            </div>
          </Section>
        )}

        <Section title="פרופיל יכולות" icon={MapPin}>
          {detail.scoutingReport ? (
            <>
              <AttributeRadar categories={buildAttributeRadarData(detail.scoutingReport)} />
              {strengths.length > 0 && (
                <div className="mt-4">
                  <div className="text-xs font-semibold mb-2" style={{ color: "var(--lp-gold-soft)" }}>
                    יכולות בולטות
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {strengths.slice(0, 6).map((s: any) => (
                      <span key={s.key} className="lp-btn-glass rounded-full px-3.5 py-1.5 text-xs font-semibold">
                        {s.label}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {allAttributes.length > 0 && (
                <div className="mt-6">
                  <AttributeBarChart items={allAttributes} />
                </div>
              )}
            </>
          ) : (
            <div className="text-sm text-center py-4" style={{ color: "var(--lp-muted)" }}>
              אין עדיין דוח סקאוטינג לשחקן זה
            </div>
          )}
        </Section>

        <div className="lp-glass rounded-3xl p-7 mt-6 text-center" style={{ border: "1.5px solid var(--lp-gold)" }}>
          <div className="text-lg font-bold">מחפש/ת איש מקצוע מתאים?</div>
          <p className="text-sm mt-2 max-w-md mx-auto" style={{ color: "var(--lp-muted)" }}>
            סוכן, תזונאי ספורט, מאמן מנטלי, פיזיותרפיסט או כל בעל מקצוע אחר, מהמאגר של SFG.
          </p>
          <div className="mt-5">
            <ProfessionalReferralButton playerId={id} firstName={player.firstName} />
          </div>
        </div>

        <div className="flex items-center justify-center gap-2.5 mt-10">
          <Image src="/logo-icon.png" alt="SFG" width={24} height={24} className="rounded-md w-6 h-6" />
          <span className="text-sm font-semibold">
            SFG <span style={{ color: "var(--lp-gold)" }}>OS</span>
          </span>
        </div>
      </div>
    </div>
  );
}

function Section({ title, icon: Icon, children }: { title: string; icon: any; children: React.ReactNode }) {
  return (
    <div className="lp-glass rounded-3xl p-6 mt-6">
      <div className="flex items-center gap-2.5 mb-4">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: "rgba(227,181,99,0.12)", color: "var(--lp-gold)" }}
        >
          <Icon size={15} />
        </div>
        <h2 className="font-bold text-sm">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function RowGrid({ rows }: { rows: [string, any][] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
      {rows.map(([label, value]) => (
        <div key={label} className="flex justify-between gap-3 border-b pb-2" style={{ borderColor: "var(--lp-glass-border)" }}>
          <span style={{ color: "var(--lp-muted)" }}>{label}</span>
          <span className="font-medium">{String(value)}</span>
        </div>
      ))}
    </div>
  );
}
