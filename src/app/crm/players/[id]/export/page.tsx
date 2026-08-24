import { notFound } from "next/navigation";
import { getPlayerDetail } from "@/lib/data";
import { getCurrentCrmUser } from "@/lib/current-user";
import { getVisiblePlayerIds } from "@/lib/permissions";
import { formatDate, calcAge } from "@/lib/format";
import { buildAllAttributesData, summarizePlayerScouting } from "@/lib/scouting";
import { guessPositionGroup } from "@/lib/constants";
import PrintButton from "@/components/PrintButton";
import CopyLinkButton from "@/components/CopyLinkButton";
import AttributeBarChart from "@/components/AttributeBarChart";
import GenerateSummaryButton from "@/components/GenerateSummaryButton";
import { generatePlayerAiSummary } from "@/lib/actions";
import { ExternalLink } from "lucide-react";

const CONTRACT_STATUS_LABELS_EN: Record<string, string> = {
  ACTIVE: "Active",
  ENDED: "Ended",
  IN_NEGOTIATION: "In Negotiation",
  UNKNOWN: "Unknown",
};

const FOOT_LABELS_EN: Record<string, string> = {
  ימין: "Right",
  שמאל: "Left",
  "שתי הרגליים": "Both",
};

const STATS_LINK_PRIORITY = ["TRANSFERMARKT", "SOFASCORE", "WYSCOUT", "INSTAT"];
const CLIP_LINK_PRIORITY = ["YOUTUBE", "HIGHLIGHTS", "FULL_MATCH", "HUDL", "VIMEO"];

function pickStatsLink(links: any[]) {
  for (const type of STATS_LINK_PRIORITY) {
    const found = links.find((l) => l.type === type);
    if (found) return found;
  }
  return undefined;
}

function pickClipVideo(videos: any[], links: any[]) {
  const readyVideos = videos.filter((v) => v.readyToSend);
  for (const type of ["HIGHLIGHTS", "FULL_MATCH", "TRAINING", "MEDIA", "SCOUTING"]) {
    const found = readyVideos.find((v) => v.type === type) ?? videos.find((v) => v.type === type);
    if (found) return { title: found.title, url: found.url };
  }
  for (const type of CLIP_LINK_PRIORITY) {
    const found = links.find((l) => l.type === type);
    if (found) return { title: found.title, url: found.url };
  }
  return undefined;
}

export default async function PlayerExportPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ summaryError?: string }>;
}) {
  const { id } = await params;
  const { summaryError } = await searchParams;
  const currentUser = await getCurrentCrmUser();
  const visiblePlayerIds = currentUser ? await getVisiblePlayerIds(currentUser) : [];
  const detail = await getPlayerDetail(id, visiblePlayerIds);
  if (!detail) notFound();

  const { player } = detail;
  const displayName = player.fullNameEnglish || `${player.firstName} ${player.lastName}`;
  const foot = player.strongFoot ? FOOT_LABELS_EN[player.strongFoot] ?? player.strongFoot : null;
  const latestContract = detail.contracts[0];
  const statsLink = pickStatsLink(detail.links);
  const clip = pickClipVideo(detail.videos, detail.links);

  const report = detail.scoutingReport;
  const positionGroup = report?.positionGroup ?? guessPositionGroup(player.mainPosition);
  const attributes = report ? buildAllAttributesData(report, positionGroup, "en") : [];
  const { strengths, improvements } = summarizePlayerScouting(attributes);

  const rows: [string, string | null][] = [
    ["Date of Birth", formatDate(player.dateOfBirth)],
    ["Age", calcAge(player.dateOfBirth)?.toString() ?? null],
    ["Nationality", player.nationality],
    ["Second Nationality", player.secondNationality],
    ["Passport Number", player.passportNumber],
    ["Height", player.height ? `${player.height} cm` : null],
    ["Weight", player.weight ? `${player.weight} kg` : null],
    ["Position", player.mainPosition],
    ["Secondary Positions", player.secondaryPositions],
    ["Strong Foot", foot],
    ["League", player.currentLeague],
    ["Country", player.currentCountry],
  ].filter(([, v]) => v) as [string, string][];

  return (
    <div dir="ltr" className="min-h-screen py-10 px-4" style={{ background: "var(--background)" }}>
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="flex justify-end gap-2 print:hidden">
          <CopyLinkButton />
          <PrintButton />
        </div>

        {/* Header */}
        <div className="card p-6 flex items-center gap-4">
          <span
            className="w-16 h-16 rounded-full overflow-hidden shrink-0 flex items-center justify-center border"
            style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}
          >
            {player.photoPath ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={player.photoPath} alt={displayName} className="w-full h-full object-cover" />
            ) : (
              <span className="text-lg font-semibold" style={{ color: "var(--muted)" }}>
                {player.firstName?.[0]}
                {player.lastName?.[0]}
              </span>
            )}
          </span>

          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold">{displayName}</h1>
            <p className="text-sm" style={{ color: "var(--muted)" }}>
              {player.mainPosition}
              {detail.club ? ` · ${detail.club.name}` : " · Free Agent"}
              {player.currentCountry ? ` · ${player.currentCountry}` : ""}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-icon.png" alt="SFG" className="w-10 h-10 rounded-xl" />
            <div className="text-right">
              <div className="text-sm font-bold" style={{ color: "var(--gold)" }}>
                SFG
              </div>
              <div className="text-[11px]" style={{ color: "var(--muted)" }}>
                Football Agency
              </div>
            </div>
          </div>
        </div>

        {/* Player information */}
        <div className="card p-5">
          <h2 className="text-sm font-bold mb-3" style={{ color: "var(--navy)" }}>
            Player Information
          </h2>
          <ExportDL rows={rows} />
        </div>

        {/* Professional summary (AI-generated, web-search-backed) */}
        <div className="card p-5">
          <div className="flex items-center justify-between gap-3 mb-3">
            <h2 className="text-sm font-bold" style={{ color: "var(--navy)" }}>
              Professional Summary
            </h2>
            <form action={generatePlayerAiSummary.bind(null, id)} className="print:hidden">
              <GenerateSummaryButton hasSummary={!!player.aiSummary} />
            </form>
          </div>
          {summaryError && (
            <div
              className="rounded-md px-4 py-2.5 text-sm font-medium mb-3 print:hidden"
              style={{ background: "var(--danger-bg)", color: "var(--danger)" }}
            >
              {summaryError}
            </div>
          )}
          {player.aiSummary ? (
            <>
              <p className="text-sm whitespace-pre-wrap">{player.aiSummary}</p>
              <p className="text-xs mt-2 print:hidden" style={{ color: "var(--muted)" }}>
                Generated {formatDate(player.aiSummaryGeneratedAt)}
              </p>
            </>
          ) : (
            <p className="text-sm" style={{ color: "var(--muted)" }}>
              No summary generated yet.
            </p>
          )}
        </div>

        {/* Contract status */}
        <div className="card p-5">
          <h2 className="text-sm font-bold mb-3" style={{ color: "var(--navy)" }}>
            Contract Status
          </h2>
          {latestContract ? (
            <ExportDL
              rows={[
                ["Club", latestContract.club?.name ?? "—"],
                ["Status", CONTRACT_STATUS_LABELS_EN[latestContract.status] ?? latestContract.status],
                ["Start Date", formatDate(latestContract.startDate)],
                ["End Date", formatDate(latestContract.endDate)],
              ]}
            />
          ) : (
            <p className="text-sm" style={{ color: "var(--muted)" }}>
              No contract on file.
            </p>
          )}
        </div>

        {/* Scouting attributes */}
        {attributes.length > 0 && (
          <div className="card p-5">
            <h2 className="text-sm font-bold mb-3" style={{ color: "var(--navy)" }}>
              Scouting Attributes
            </h2>
            <AttributeBarChart items={attributes} />
          </div>
        )}

        {(strengths.length > 0 || improvements.length > 0) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="card p-5">
              <h2 className="text-sm font-bold mb-3" style={{ color: "var(--gold)" }}>
                Strengths
              </h2>
              <ul className="space-y-1.5 text-sm">
                {strengths.map((s) => (
                  <li key={s.key} className="flex items-center justify-between gap-3 border-b pb-1" style={{ borderColor: "var(--border)" }}>
                    <span>{s.label}</span>
                    <span className="font-medium" style={{ color: "var(--gold)" }}>{s.value.toFixed(1)} / 5</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="card p-5">
              <h2 className="text-sm font-bold mb-3" style={{ color: "var(--navy)" }}>
                Development Areas
              </h2>
              <ul className="space-y-1.5 text-sm">
                {improvements.map((s) => (
                  <li key={s.key} className="flex items-center justify-between gap-3 border-b pb-1" style={{ borderColor: "var(--border)" }}>
                    <span>{s.label}</span>
                    <span className="font-medium" style={{ color: "var(--muted)" }}>{s.value.toFixed(1)} / 5</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Links */}
        <div className="card p-5">
          <h2 className="text-sm font-bold mb-3" style={{ color: "var(--navy)" }}>
            Links
          </h2>
          <div className="flex flex-wrap gap-2">
            {statsLink ? (
              <a href={statsLink.url} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm">
                <ExternalLink size={13} />
                Stats Profile ({statsLink.title || statsLink.type})
              </a>
            ) : (
              <span className="badge badge-neutral">No stats link on file</span>
            )}
            {clip ? (
              <a href={clip.url} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm">
                <ExternalLink size={13} />
                Video Clip ({clip.title || "Watch"})
              </a>
            ) : (
              <span className="badge badge-neutral">No video clip on file</span>
            )}
          </div>
        </div>

        <p className="text-center text-xs print:hidden" style={{ color: "var(--muted)" }}>
          Prepared by SFG Football Agency &middot; {formatDate(new Date().toISOString())}
        </p>
      </div>
    </div>
  );
}

function ExportDL({ rows }: { rows: [string, string | null][] }) {
  return (
    <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 text-sm">
      {rows.map(([label, value]) => (
        <div key={label} className="flex justify-between gap-3 border-b pb-1" style={{ borderColor: "var(--border)" }}>
          <dt style={{ color: "var(--muted)" }}>{label}</dt>
          <dd className="font-medium">{value ?? "—"}</dd>
        </div>
      ))}
    </dl>
  );
}
