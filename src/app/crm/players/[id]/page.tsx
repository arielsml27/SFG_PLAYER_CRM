import Link from "next/link";
import { notFound } from "next/navigation";
import { getPlayerDetail } from "@/lib/data";
import { formatDate, formatMoney, calcAge, daysUntil } from "@/lib/format";
import { buildAttributeRadarData, buildAllAttributesData, summarizePlayerScouting } from "@/lib/scouting";
import StatusBadge from "@/components/StatusBadge";
import ConfirmSubmitButton from "@/components/ConfirmSubmitButton";
import AutoSubmitSelect from "@/components/AutoSubmitSelect";
import AttributeRadar from "@/components/AttributeRadar";
import AttributeBarChart from "@/components/AttributeBarChart";
import {
  addClubContract,
  deleteClubContract,
  addRepresentation,
  deleteRepresentation,
  addLink,
  deleteLink,
  addVideo,
  deleteVideo,
  addDocument,
  deleteDocument,
  addContact,
  deleteContact,
  addTimelineEvent,
  deleteTimelineEvent,
  addTask,
  updateTaskStatus,
  deleteTask,
  addDeal,
  deleteDeal,
  deletePlayer,
  upsertScoutingReport,
} from "@/lib/actions";
import {
  CONTRACT_STATUSES,
  CONTRACT_STATUS_LABELS,
  REPRESENTATION_STATUSES,
  REPRESENTATION_STATUS_LABELS,
  LINK_TYPES,
  LINK_TYPE_LABELS,
  VIDEO_TYPES,
  VIDEO_TYPE_LABELS,
  DOCUMENT_TYPES,
  DOCUMENT_TYPE_LABELS,
  CONTACT_ROLES,
  CONTACT_ROLE_LABELS,
  TIMELINE_EVENT_TYPES,
  TIMELINE_EVENT_TYPE_LABELS,
  TASK_PRIORITIES,
  TASK_PRIORITY_LABELS,
  TASK_STATUSES,
  TASK_STATUS_LABELS,
  YES_NO_NA,
  YES_NO_NA_LABELS,
  DEAL_TYPES,
  DEAL_TYPE_LABELS,
  DEAL_STATUSES,
  DEAL_STATUS_LABELS,
  PHYSICAL_SKILLS,
  MENTAL_SKILLS,
  FAMILY_SKILLS,
  ON_FIELD_BEHAVIOR_SKILLS,
  BODY_LANGUAGE_SKILLS,
  OVERALL_RATING_SKILLS,
  POSITION_GROUPS,
  POSITION_GROUP_LABELS,
  TECHNICAL_SKILLS_BY_POSITION,
  guessPositionGroup,
} from "@/lib/constants";
import { Pencil, Trash2, Plus, ExternalLink, FileOutput } from "lucide-react";
import StarRating from "@/components/StarRating";
import TechnicalSkillsSection from "@/components/TechnicalSkillsSection";

const TABS = [
  { key: "overview", label: "פרטים כלליים" },
  { key: "contract", label: "חוזה מועדון" },
  { key: "representation", label: "ייצוג" },
  { key: "professional", label: "מקצועי" },
  { key: "scouting", label: "דוח סקאוטינג" },
  { key: "links", label: "לינקים" },
  { key: "videos", label: "סרטונים" },
  { key: "documents", label: "מסמכים" },
  { key: "contacts", label: "אנשי קשר" },
  { key: "timeline", label: "יומן אירועים" },
  { key: "tasks", label: "משימות" },
  { key: "deals", label: "עסקאות" },
] as const;

export default async function PlayerProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string; saved?: string }>;
}) {
  const { id } = await params;
  const { tab = "overview", saved } = await searchParams;
  const detail = await getPlayerDetail(id);
  if (!detail) notFound();

  const { player } = detail;
  const contractDays = detail.contracts[0] ? daysUntil(detail.contracts[0].endDate) : null;
  const repDays = detail.representation[0] ? daysUntil(detail.representation[0].endDate) : null;

  return (
    <div className="max-w-6xl space-y-5">
      {/* Header */}
      <div className="card p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <span
              className="w-16 h-16 rounded-full overflow-hidden shrink-0 flex items-center justify-center border"
              style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}
            >
              {player.photoPath ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={player.photoPath} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-sm font-semibold" style={{ color: "var(--muted)" }}>
                  {player.firstName?.[0]}
                  {player.lastName?.[0]}
                </span>
              )}
            </span>
            <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold">
                {player.firstName} {player.lastName}
              </h1>
              <StatusBadge kind="player" value={player.status} />
              <StatusBadge kind="representation" value={player.representationStatus} />
              {(contractDays !== null && contractDays <= 90) && (
                <span className="badge badge-danger">חוזה מסתיים בעוד {contractDays} ימים</span>
              )}
              {(repDays !== null && repDays <= 90) && (
                <span className="badge badge-danger">ייצוג מסתיים בעוד {repDays} ימים</span>
              )}
            </div>
            <div className="text-sm mt-1" style={{ color: "var(--muted)" }}>
              {player.fullNameHebrew ?? player.fullNameEnglish ?? ""} · גיל {calcAge(player.dateOfBirth) ?? "—"} · {player.mainPosition}
              {detail.club ? ` · ${detail.club.name}` : ""}
              {player.currentCountry ? ` · ${player.currentCountry}` : ""}
            </div>
            {player.nextAction && (
              <div className="mt-2 inline-flex items-center gap-2 badge badge-gold">
                פעולה הבאה: {player.nextAction}
                {player.nextActionDate ? ` (עד ${formatDate(player.nextActionDate)})` : ""}
              </div>
            )}
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            <Link href={`/crm/players/${id}/export`} target="_blank" className="btn btn-outline">
              <FileOutput size={14} />
              ייצוא דוח
            </Link>
            <Link href={`/crm/players/${id}/edit`} className="btn btn-outline">
              <Pencil size={14} />
              עריכה
            </Link>
            <form action={deletePlayer.bind(null, id)}>
              <ConfirmSubmitButton
                confirmMessage={`האם למחוק את ${player.firstName} ${player.lastName}? כל המידע הקשור יימחק.`}
                doubleConfirm
              >
                <Trash2 size={14} />
                מחיקה
              </ConfirmSubmitButton>
            </form>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto border-b" style={{ borderColor: "var(--border)" }}>
        {TABS.map((t) => (
          <Link key={t.key} href={`/crm/players/${id}?tab=${t.key}`} className={`tab-link ${tab === t.key ? "active" : ""}`}>
            {t.label}
          </Link>
        ))}
      </div>

      <div className="card p-5">
        {tab === "overview" && <OverviewTab id={id} player={player} club={detail.club} report={detail.scoutingReport} />}
        {tab === "contract" && <ContractTab id={id} detail={detail} />}
        {tab === "representation" && <RepresentationTab id={id} detail={detail} />}
        {tab === "professional" && <ProfessionalTab player={player} />}
        {tab === "scouting" && <ScoutingReportTab id={id} player={player} report={detail.scoutingReport} saved={saved === "1"} />}
        {tab === "links" && <LinksTab id={id} detail={detail} />}
        {tab === "videos" && <VideosTab id={id} detail={detail} />}
        {tab === "documents" && <DocumentsTab id={id} detail={detail} />}
        {tab === "contacts" && <ContactsTab id={id} detail={detail} />}
        {tab === "timeline" && <TimelineTab id={id} detail={detail} />}
        {tab === "tasks" && <TasksTab id={id} detail={detail} />}
        {tab === "deals" && <DealsTab id={id} detail={detail} />}
      </div>
    </div>
  );
}

// ---------------- Tabs ----------------

function OverviewTab({ id, player, club, report }: any) {
  const positionGroup = report?.positionGroup ?? guessPositionGroup(player.mainPosition);
  const allAttributes = report ? buildAllAttributesData(report, positionGroup) : [];
  const { strengths, improvements } = summarizePlayerScouting(allAttributes);

  const rows: [string, any][] = [
    ["שם עברית", player.fullNameHebrew],
    ["שם אנגלית", player.fullNameEnglish],
    ["תאריך לידה", formatDate(player.dateOfBirth)],
    ["גיל", calcAge(player.dateOfBirth)],
    ["לאום", player.nationality],
    ["אזרחות נוספת", player.secondNationality],
    ["דרכון", player.passportNumber],
    ["גובה", player.height ? `${player.height} ס״מ` : null],
    ["משקל", player.weight ? `${player.weight} ק״ג` : null],
    ["עמדה ראשית", player.mainPosition],
    ["עמדות משניות", player.secondaryPositions],
    ["רגל חזקה", player.strongFoot],
    ["מועדון נוכחי", club?.name],
    ["ליגה", player.currentLeague],
    ["מדינה", player.currentCountry],
    ["סוכן אחראי", player.agentInCharge],
    ["איש קשר משפחתי", player.familyContactName],
    ["טלפון", player.familyContactPhone],
    ["אימייל", player.familyContactEmail],
    ["כתובת", player.address],
    ["תגיות", player.tags],
  ];
  return (
    <div>
      <DL rows={rows} />
      {player.notes && (
        <div className="mt-4">
          <div className="field-label">הערות כלליות</div>
          <p className="text-sm whitespace-pre-wrap">{player.notes}</p>
        </div>
      )}

      <div className="mt-6 card p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-bold text-sm" style={{ color: "var(--navy)" }}>
            ניתוח יכולות (לפי דוח הסקאוטינג)
          </h3>
          <Link href={`/crm/players/${id}?tab=scouting`} className="text-xs hover:underline" style={{ color: "var(--gold)" }}>
            לצפייה בדוח המלא ←
          </Link>
        </div>
        {report ? (
          <AttributeRadar categories={buildAttributeRadarData(report)} />
        ) : (
          <Empty text="אין עדיין דוח סקאוטינג לשחקן זה" />
        )}
      </div>

      {report && allAttributes.length > 0 && (
        <div className="mt-6 card p-4">
          <h3 className="font-bold text-sm mb-3" style={{ color: "var(--navy)" }}>
            כל היכולות (דוח סקאוטינג מלא)
          </h3>
          <AttributeBarChart items={allAttributes} />
        </div>
      )}

      {report && (strengths.length > 0 || improvements.length > 0) && (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="card p-4">
            <h3 className="font-bold text-sm mb-3" style={{ color: "var(--gold)" }}>
              יכולות חזקות
            </h3>
            {strengths.length === 0 ? (
              <Empty text="אין עדיין דירוגים גבוהים מספיק" />
            ) : (
              <ul className="space-y-1.5 text-sm">
                {strengths.map((s) => (
                  <li key={s.key} className="flex items-center justify-between gap-3 border-b pb-1" style={{ borderColor: "var(--border)" }}>
                    <span>{s.label}</span>
                    <span className="font-medium" style={{ color: "var(--gold)" }}>{s.value.toFixed(1)} / 5</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="card p-4">
            <h3 className="font-bold text-sm mb-3" style={{ color: "var(--navy)" }}>
              נקודות לשיפור
            </h3>
            {improvements.length === 0 ? (
              <Empty text="אין עדיין דירוגים נמוכים" />
            ) : (
              <ul className="space-y-1.5 text-sm">
                {improvements.map((s) => (
                  <li key={s.key} className="flex items-center justify-between gap-3 border-b pb-1" style={{ borderColor: "var(--border)" }}>
                    <span>{s.label}</span>
                    <span className="font-medium" style={{ color: "var(--muted)" }}>{s.value.toFixed(1)} / 5</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function ProfessionalTab({ player }: any) {
  const rows: [string, any][] = [
    ["תיאור קצר", player.shortDescription],
    ["חוזקות", player.strengths],
    ["חולשות", player.weaknesses],
    ["סגנון משחק", player.playingStyle],
    ["תפקיד אידיאלי", player.idealRole],
    ["רמת יעד", player.targetLevel],
    ["מועדונים רלוונטיים", player.relevantClubs],
    ["הערכת שווי פנימית", player.internalValuation],
    ["דירוג פנימי", player.internalRating ? `${player.internalRating}/10` : null],
    ["פוטנציאל", player.potentialRating ? `${player.potentialRating}/10` : null],
    ["רמת דחיפות", player.priorityLevel],
  ];
  return <DL rows={rows} />;
}

function ScoutingReportTab({
  id,
  player,
  report,
  saved,
}: {
  id: string;
  player: any;
  report: any;
  saved?: boolean;
}) {
  const action = upsertScoutingReport.bind(null, id);
  const defaultGroup = report?.positionGroup ?? guessPositionGroup(player.mainPosition);
  const technicalRatings: Record<string, number> = report?.technicalRatings ? JSON.parse(report.technicalRatings) : {};

  return (
    <form action={action} className="space-y-4">
      {saved && (
        <div
          className="rounded-md px-4 py-2.5 text-sm font-medium"
          style={{ background: "rgba(95, 224, 95, 0.14)", color: "var(--gold)" }}
        >
          הדוח נשמר בהצלחה
        </div>
      )}

      <div className="flex justify-end">
        <button type="submit" className="btn btn-gold btn-sm">
          שמור דוח סקאוטינג
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <label className="field-label">דווח על ידי</label>
          <input name="scoutedBy" defaultValue={report?.scoutedBy ?? ""} className="input" />
        </div>
        <div>
          <label className="field-label">תאריך צפייה אחרונה</label>
          <input type="date" name="lastWatchedDate" defaultValue={report?.lastWatchedDate ?? ""} className="input" />
        </div>
      </div>

      <TechnicalSkillsSection
        positionGroups={POSITION_GROUPS.map((g) => [g, POSITION_GROUP_LABELS[g]])}
        skillsByGroup={TECHNICAL_SKILLS_BY_POSITION}
        defaultGroup={defaultGroup}
        defaultRatings={technicalRatings}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <StarSkillGroup title="התנהגות ופעולות במגרש" skills={ON_FIELD_BEHAVIOR_SKILLS} report={report} />
        <StarSkillGroup title="שפת גוף ותגובות" skills={BODY_LANGUAGE_SKILLS} report={report} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <StarSkillGroup title="פיזי" skills={PHYSICAL_SKILLS} report={report} />
        <StarSkillGroup title="מנטלי" skills={MENTAL_SKILLS} report={report} />
        <StarSkillGroup title="משפחה (אם נצפים)" skills={FAMILY_SKILLS} report={report} />
      </div>

      <StarSkillGroup title="סיכום ודירוג פוטנציאל" skills={OVERALL_RATING_SKILLS} report={report} />

      <div className="card p-4">
        <label className="field-label">סיכום והערכה כללית</label>
        <textarea name="summary" defaultValue={report?.summary ?? ""} className="input" rows={4} />
      </div>

      <button type="submit" className="btn btn-gold">
        שמור דוח סקאוטינג
      </button>
    </form>
  );
}

function StarSkillGroup({ title, skills, report }: { title: string; skills: [string, string][]; report: any }) {
  return (
    <div className="card p-4">
      <h3 className="font-bold mb-3 text-sm" style={{ color: "var(--navy)" }}>
        {title}
      </h3>
      <div className="space-y-2.5">
        {skills.map(([key, label]) => (
          <StarRating key={key} name={key} label={label} defaultValue={report?.[key] ?? null} />
        ))}
      </div>
    </div>
  );
}

function ContractTab({ id, detail }: any) {
  return (
    <TabSection
      title="חוזי מועדון"
      addForm={
        <AddForm action={addClubContract.bind(null, id)} title="חוזה חדש">
          <SelectField name="clubId" label="מועדון" options={detail.allClubs.map((c: any) => [c.id, c.name])} />
          <TextField name="startDate" label="תאריך התחלה" type="date" required />
          <TextField name="endDate" label="תאריך סיום" type="date" required />
          <TextField name="monthlySalary" label="שכר חודשי" type="number" />
          <TextField name="signingBonus" label="מענק חתימה" type="number" />
          <TextField name="releaseClause" label="סעיף שחרור" type="number" />
          <TextField name="sellOnPercent" label="אחוז מכירה עתידית" type="number" />
          <SelectField name="status" label="סטטוס" options={CONTRACT_STATUSES.map((s) => [s, CONTRACT_STATUS_LABELS[s]])} defaultValue="ACTIVE" />
          <TextField name="bonuses" label="מענקים נוספים" full />
          <TextField name="trainingCompensationNotes" label="הערות פיצוי אימונים" full />
          <TextField name="notes" label="הערות משפטיות" full textarea />
        </AddForm>
      }
    >
      {detail.contracts.length === 0 && <Empty text="אין חוזים רשומים" />}
      {detail.contracts.map((c: any) => (
        <Card key={c.id} deleteAction={deleteClubContract.bind(null, id, c.id)}>
          <div className="flex items-center gap-2 mb-2">
            <strong>{c.club?.name ?? "ללא מועדון"}</strong>
            <StatusBadge kind="contract" value={c.status} />
          </div>
          <DL
            compact
            rows={[
              ["תאריך התחלה", formatDate(c.startDate)],
              ["תאריך סיום", formatDate(c.endDate)],
              ["שכר חודשי", formatMoney(c.monthlySalary)],
              ["מענק חתימה", formatMoney(c.signingBonus)],
              ["סעיף שחרור", formatMoney(c.releaseClause)],
              ["אחוז מכירה עתידית", c.sellOnPercent ? `${c.sellOnPercent}%` : null],
              ["מענקים", c.bonuses],
              ["פיצוי אימונים", c.trainingCompensationNotes],
              ["הערות", c.notes],
            ]}
          />
        </Card>
      ))}
    </TabSection>
  );
}

function RepresentationTab({ id, detail }: any) {
  return (
    <TabSection
      title="הסכמי ייצוג"
      addForm={
        <AddForm action={addRepresentation.bind(null, id)} title="הסכם ייצוג חדש">
          <TextField name="startDate" label="תאריך חתימה" type="date" required />
          <TextField name="endDate" label="תאריך סיום" type="date" required />
          <TextField name="commissionPercent" label="אחוז עמלה" type="number" />
          <SelectField name="status" label="סטטוס" options={REPRESENTATION_STATUSES.map((s) => [s, REPRESENTATION_STATUS_LABELS[s]])} defaultValue="ACTIVE" />
          <CheckboxField name="exclusive" label="בלעדיות" />
          <CheckboxField name="isMinor" label="קטין" />
          <SelectField name="parentsSigned" label="חתימות הורים" options={YES_NO_NA.map((v) => [v, YES_NO_NA_LABELS[v]])} defaultValue="NA" />
          <TextField name="signedBy" label="מי חתם" />
          <TextField name="notes" label="הערות" full textarea />
        </AddForm>
      }
    >
      {detail.representation.length === 0 && <Empty text="אין הסכמי ייצוג רשומים" />}
      {detail.representation.map((r: any) => (
        <Card key={r.id} deleteAction={deleteRepresentation.bind(null, id, r.id)}>
          <div className="flex items-center gap-2 mb-2">
            <strong>הסכם ייצוג</strong>
            <StatusBadge kind="representation" value={r.status} />
            {r.isMinor && <span className="badge badge-warn">קטין</span>}
            {r.exclusive && <span className="badge badge-neutral">בלעדי</span>}
          </div>
          <DL
            compact
            rows={[
              ["תאריך חתימה", formatDate(r.startDate)],
              ["תאריך סיום", formatDate(r.endDate)],
              ["אחוז עמלה", r.commissionPercent ? `${r.commissionPercent}%` : null],
              ["חתימות הורים", YES_NO_NA_LABELS[r.parentsSigned] ?? r.parentsSigned],
              ["מי חתם", r.signedBy],
              ["הערות", r.notes],
            ]}
          />
        </Card>
      ))}
    </TabSection>
  );
}

function LinksTab({ id, detail }: any) {
  return (
    <TabSection
      title="לינקים"
      addForm={
        <AddForm action={addLink.bind(null, id)} title="לינק חדש">
          <SelectField name="type" label="סוג" options={LINK_TYPES.map((t) => [t, LINK_TYPE_LABELS[t]])} />
          <TextField name="title" label="כותרת" required />
          <TextField name="url" label="URL" required full />
          <TextField name="notes" label="הערות" full />
        </AddForm>
      }
    >
      {detail.links.length === 0 && <Empty text="אין לינקים" />}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {detail.links.map((l: any) => (
          <Card key={l.id} deleteAction={deleteLink.bind(null, id, l.id)}>
            <div className="flex items-center gap-2 mb-1">
              <span className="badge badge-neutral">{LINK_TYPE_LABELS[l.type] ?? l.type}</span>
              <strong>{l.title}</strong>
            </div>
            <a href={l.url} target="_blank" rel="noreferrer" className="text-sm inline-flex items-center gap-1 hover:underline" style={{ color: "var(--navy)" }}>
              {l.url} <ExternalLink size={12} />
            </a>
            {l.notes && <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>{l.notes}</p>}
          </Card>
        ))}
      </div>
    </TabSection>
  );
}

function VideosTab({ id, detail }: any) {
  return (
    <TabSection
      title="סרטונים"
      addForm={
        <AddForm action={addVideo.bind(null, id)} title="סרטון חדש">
          <TextField name="title" label="שם הסרטון" required />
          <SelectField name="type" label="סוג" options={VIDEO_TYPES.map((t) => [t, VIDEO_TYPE_LABELS[t]])} />
          <TextField name="url" label="לינק" required full />
          <TextField name="date" label="תאריך" type="date" />
          <CheckboxField name="readyToSend" label="מוכן לשליחה למועדונים" />
          <TextField name="notes" label="הערות" full />
        </AddForm>
      }
    >
      {detail.videos.length === 0 && <Empty text="אין סרטונים" />}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {detail.videos.map((v: any) => (
          <Card key={v.id} deleteAction={deleteVideo.bind(null, id, v.id)}>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="badge badge-neutral">{VIDEO_TYPE_LABELS[v.type] ?? v.type}</span>
              <strong>{v.title}</strong>
              {v.readyToSend ? <span className="badge badge-ok">מוכן לשליחה</span> : <span className="badge badge-warn">לא מוכן</span>}
            </div>
            <a href={v.url} target="_blank" rel="noreferrer" className="text-sm inline-flex items-center gap-1 hover:underline" style={{ color: "var(--navy)" }}>
              {v.url} <ExternalLink size={12} />
            </a>
            <div className="text-xs mt-1" style={{ color: "var(--muted)" }}>
              {formatDate(v.date)} {v.notes ? `· ${v.notes}` : ""}
            </div>
          </Card>
        ))}
      </div>
    </TabSection>
  );
}

function DocumentsTab({ id, detail }: any) {
  return (
    <TabSection
      title="מסמכים"
      addForm={
        <AddForm action={addDocument.bind(null, id)} title="מסמך חדש">
          <TextField name="title" label="שם המסמך" required />
          <SelectField name="type" label="סוג" options={DOCUMENT_TYPES.map((t) => [t, DOCUMENT_TYPE_LABELS[t]])} />
          <TextField name="filePath" label="נתיב קובץ / לינק" full />
          <TextField name="expiryDate" label="תאריך תפוגה" type="date" />
          <TextField name="notes" label="הערות" full />
        </AddForm>
      }
    >
      {detail.documents.length === 0 && <Empty text="אין מסמכים" />}
      <table className="data-table">
        <thead>
          <tr>
            <th>שם</th>
            <th>סוג</th>
            <th>תוקף</th>
            <th>הערות</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {detail.documents.map((d: any) => (
            <tr key={d.id}>
              <td className="font-medium">{d.title}</td>
              <td>{DOCUMENT_TYPE_LABELS[d.type] ?? d.type}</td>
              <td>{formatDate(d.expiryDate)}</td>
              <td className="text-xs" style={{ color: "var(--muted)" }}>{d.notes}</td>
              <td>
                <form action={deleteDocument.bind(null, id, d.id)}>
                  <ConfirmSubmitButton confirmMessage="למחוק את המסמך?">
                    <Trash2 size={13} />
                  </ConfirmSubmitButton>
                </form>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </TabSection>
  );
}

function ContactsTab({ id, detail }: any) {
  return (
    <TabSection
      title="אנשי קשר"
      addForm={
        <AddForm action={addContact.bind(null, id)} title="איש קשר חדש">
          <TextField name="name" label="שם" required />
          <SelectField name="role" label="תפקיד" options={CONTACT_ROLES.map((r) => [r, CONTACT_ROLE_LABELS[r]])} />
          <TextField name="phone" label="טלפון" />
          <TextField name="email" label="אימייל" />
          <TextField name="whatsapp" label="WhatsApp" />
          <TextField name="relation" label="קשר לשחקן" />
          <TextField name="notes" label="הערות" full />
        </AddForm>
      }
    >
      {detail.contacts.length === 0 && <Empty text="אין אנשי קשר" />}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {detail.contacts.map((c: any) => (
          <Card key={c.id} deleteAction={deleteContact.bind(null, id, c.id)}>
            <div className="flex items-center gap-2 mb-1">
              <span className="badge badge-neutral">{CONTACT_ROLE_LABELS[c.role] ?? c.role}</span>
              <strong>{c.name}</strong>
            </div>
            <DL
              compact
              rows={[
                ["טלפון", c.phone],
                ["אימייל", c.email],
                ["WhatsApp", c.whatsapp],
                ["קשר", c.relation],
                ["הערות", c.notes],
              ]}
            />
          </Card>
        ))}
      </div>
    </TabSection>
  );
}

function TimelineTab({ id, detail }: any) {
  return (
    <TabSection
      title="יומן אירועים"
      addForm={
        <AddForm action={addTimelineEvent.bind(null, id)} title="אירוע חדש">
          <SelectField name="type" label="סוג אירוע" options={TIMELINE_EVENT_TYPES.map((t) => [t, TIMELINE_EVENT_TYPE_LABELS[t]])} />
          <TextField name="title" label="כותרת" required />
          <TextField name="eventDate" label="תאריך" type="date" required />
          <TextField name="createdBy" label="נוצר על ידי" />
          <TextField name="link" label="לינק" />
          <TextField name="description" label="תיאור" full textarea />
        </AddForm>
      }
    >
      {detail.timeline.length === 0 && <Empty text="אין אירועים" />}
      <div className="space-y-3">
        {detail.timeline.map((e: any) => (
          <Card key={e.id} deleteAction={deleteTimelineEvent.bind(null, id, e.id)}>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="badge badge-neutral">{TIMELINE_EVENT_TYPE_LABELS[e.type] ?? e.type}</span>
              <strong>{e.title}</strong>
              <span className="text-xs" style={{ color: "var(--muted)" }}>{formatDate(e.eventDate)}</span>
            </div>
            {e.description && <p className="text-sm">{e.description}</p>}
            {e.link && (
              <a href={e.link} target="_blank" rel="noreferrer" className="text-xs hover:underline" style={{ color: "var(--navy)" }}>
                {e.link}
              </a>
            )}
            {e.createdBy && <div className="text-xs mt-1" style={{ color: "var(--muted)" }}>נרשם על ידי {e.createdBy}</div>}
          </Card>
        ))}
      </div>
    </TabSection>
  );
}

function TasksTab({ id, detail }: any) {
  return (
    <TabSection
      title="משימות"
      addForm={
        <AddForm action={addTask} title="משימה חדשה" hiddenFields={{ playerId: id }}>
          <TextField name="title" label="כותרת" required />
          <TextField name="owner" label="אחראי" />
          <TextField name="dueDate" label="תאריך יעד" type="date" />
          <SelectField name="priority" label="עדיפות" options={TASK_PRIORITIES.map((p) => [p, TASK_PRIORITY_LABELS[p]])} defaultValue="NORMAL" />
          <SelectField name="status" label="סטטוס" options={TASK_STATUSES.map((s) => [s, TASK_STATUS_LABELS[s]])} defaultValue="OPEN" />
          <TextField name="description" label="תיאור" full textarea />
        </AddForm>
      }
    >
      {detail.tasks.length === 0 && <Empty text="אין משימות" />}
      <table className="data-table">
        <thead>
          <tr>
            <th>כותרת</th>
            <th>אחראי</th>
            <th>תאריך יעד</th>
            <th>עדיפות</th>
            <th>סטטוס</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {detail.tasks.map((t: any) => (
            <tr key={t.id}>
              <td className="font-medium">{t.title}</td>
              <td>{t.owner ?? "—"}</td>
              <td>{formatDate(t.dueDate)}</td>
              <td>
                <StatusBadge kind="taskPriority" value={t.priority} />
              </td>
              <td>
                <form action={async (fd: FormData) => {
                  "use server";
                  await updateTaskStatus(t.id, String(fd.get("status")), id);
                }}>
                  <AutoSubmitSelect
                    name="status"
                    defaultValue={t.status}
                    options={TASK_STATUSES.map((s) => ({ value: s, label: TASK_STATUS_LABELS[s] }))}
                  />
                </form>
              </td>
              <td>
                <form action={deleteTask.bind(null, t.id, id)}>
                  <ConfirmSubmitButton confirmMessage="למחוק את המשימה?">
                    <Trash2 size={13} />
                  </ConfirmSubmitButton>
                </form>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </TabSection>
  );
}

function DealsTab({ id, detail }: any) {
  return (
    <TabSection
      title="עסקאות / מו״מ"
      addForm={
        <AddForm action={addDeal.bind(null, id)} title="עסקה חדשה">
          <SelectField name="clubId" label="מועדון" options={detail.allClubs.map((c: any) => [c.id, c.name])} />
          <SelectField name="type" label="סוג" options={DEAL_TYPES.map((t) => [t, DEAL_TYPE_LABELS[t]])} />
          <SelectField name="status" label="סטטוס" options={DEAL_STATUSES.map((s) => [s, DEAL_STATUS_LABELS[s]])} defaultValue="OPEN" />
          <TextField name="expectedValue" label="שווי צפוי" type="number" />
          <TextField name="commissionPotential" label="פוטנציאל עמלה" type="number" />
          <TextField name="startDate" label="תאריך התחלה" type="date" />
          <TextField name="expectedCloseDate" label="תאריך סגירה צפוי" type="date" />
          <TextField name="notes" label="הערות" full textarea />
        </AddForm>
      }
    >
      {detail.deals.length === 0 && <Empty text="אין עסקאות פתוחות" />}
      {detail.deals.map((d: any) => (
        <Card key={d.id} deleteAction={deleteDeal.bind(null, id, d.id)}>
          <div className="flex items-center gap-2 mb-2">
            <strong>{DEAL_TYPE_LABELS[d.type] ?? d.type}</strong>
            <StatusBadge kind="deal" value={d.status} />
            {d.club && <span className="text-sm" style={{ color: "var(--muted)" }}>{d.club.name}</span>}
          </div>
          <DL
            compact
            rows={[
              ["שווי צפוי", formatMoney(d.expectedValue)],
              ["פוטנציאל עמלה", formatMoney(d.commissionPotential)],
              ["תאריך התחלה", formatDate(d.startDate)],
              ["תאריך סגירה צפוי", formatDate(d.expectedCloseDate)],
              ["הערות", d.notes],
            ]}
          />
        </Card>
      ))}
    </TabSection>
  );
}

// ---------------- Shared small components ----------------

function TabSection({ title, addForm, children }: { title: string; addForm?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-bold">{title}</h2>
      </div>
      {addForm}
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function AddForm({
  action,
  title,
  children,
  hiddenFields,
}: {
  action: (formData: FormData) => void;
  title: string;
  children: React.ReactNode;
  hiddenFields?: Record<string, string>;
}) {
  return (
    <details className="card p-4">
      <summary className="cursor-pointer font-semibold text-sm flex items-center gap-2" style={{ color: "var(--navy)" }}>
        <Plus size={15} />
        {title}
      </summary>
      <form action={action} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-4">
        {hiddenFields &&
          Object.entries(hiddenFields).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
        {children}
        <div className="md:col-span-2 lg:col-span-3">
          <button type="submit" className="btn btn-gold btn-sm">
            הוסף
          </button>
        </div>
      </form>
    </details>
  );
}

function TextField({
  name,
  label,
  type = "text",
  required,
  full,
  textarea,
}: {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  full?: boolean;
  textarea?: boolean;
}) {
  return (
    <div className={full ? "md:col-span-2 lg:col-span-3" : ""}>
      <label className="field-label">{label}</label>
      {textarea ? (
        <textarea name={name} required={required} className="input" rows={2} />
      ) : (
        <input type={type} step={type === "number" ? "any" : undefined} name={name} required={required} className="input" />
      )}
    </div>
  );
}

function SelectField({
  name,
  label,
  options,
  defaultValue,
}: {
  name: string;
  label: string;
  options: [string, string][];
  defaultValue?: string;
}) {
  return (
    <div>
      <label className="field-label">{label}</label>
      <select name={name} defaultValue={defaultValue ?? ""} className="input">
        <option value="">בחר</option>
        {options.map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
    </div>
  );
}

function CheckboxField({ name, label }: { name: string; label: string }) {
  return (
    <label className="flex items-center gap-2 text-sm mt-5">
      <input type="checkbox" name={name} />
      {label}
    </label>
  );
}

function Card({ children, deleteAction }: { children: React.ReactNode; deleteAction?: (formData: FormData) => void }) {
  return (
    <div className="card p-4 relative">
      {children}
      {deleteAction && (
        <form action={deleteAction} className="absolute left-3 top-3">
          <ConfirmSubmitButton confirmMessage="למחוק פריט זה?" className="btn btn-outline btn-sm">
            <Trash2 size={13} />
          </ConfirmSubmitButton>
        </form>
      )}
    </div>
  );
}

function DL({ rows, compact }: { rows: [string, any][]; compact?: boolean }) {
  const filled = rows.filter(([, v]) => v !== null && v !== undefined && v !== "");
  if (filled.length === 0) return <Empty text="אין מידע" />;
  return (
    <dl className={`grid grid-cols-1 ${compact ? "" : "md:grid-cols-2"} gap-x-6 gap-y-2 text-sm`}>
      {filled.map(([label, value]) => (
        <div key={label} className="flex justify-between gap-3 border-b pb-1" style={{ borderColor: "var(--border)" }}>
          <dt style={{ color: "var(--muted)" }}>{label}</dt>
          <dd className="font-medium text-left">{String(value)}</dd>
        </div>
      ))}
    </dl>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div className="text-sm py-6 text-center" style={{ color: "var(--muted)" }}>
      {text}
    </div>
  );
}
