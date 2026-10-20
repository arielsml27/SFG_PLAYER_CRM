import { notFound } from "next/navigation";
import QRCode from "qrcode";
import "@fontsource-variable/archivo/wdth.css";
import "@fontsource/ibm-plex-sans-hebrew/400.css";
import "@fontsource/ibm-plex-sans-hebrew/600.css";
import "@fontsource/ibm-plex-sans-hebrew/700.css";
import "@fontsource/ibm-plex-mono/400.css";
import "@fontsource/ibm-plex-mono/500.css";
import { getPlayerDetail } from "@/lib/data";
import { getCurrentCrmUser } from "@/lib/current-user";
import { getVisiblePlayerIds } from "@/lib/permissions";
import { buildAllAttributesData, summarizePlayerScouting } from "@/lib/scouting";
import { guessPositionGroup } from "@/lib/constants";
import { buildHive, buildProposalBasics, collectLinks, trimSummary } from "@/lib/proposal";
import VeraProposal from "@/components/proposal/VeraProposal";

export const metadata = { title: "VERA · הצעת שחקן" };

function todayLabel(): string {
  const d = new Date();
  return `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}.${d.getFullYear()}`;
}

export default async function PlayerProposalPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const currentUser = await getCurrentCrmUser();
  const visiblePlayerIds = currentUser ? await getVisiblePlayerIds(currentUser) : [];
  const detail = await getPlayerDetail(id, visiblePlayerIds);
  if (!detail) notFound();
  const clubOptions = [...detail.allClubs].sort((a, b) => a.name.localeCompare(b.name, "he")).map((c) => ({ id: c.id, name: c.name }));

  const { player } = detail;
  const basics = buildProposalBasics(detail);
  const hive = buildHive(detail.scoutingReport, player.mainPosition);
  const { all: links, defaults } = collectLinks(detail);

  const qr: Record<string, string> = {};
  for (const l of links.filter((x) => x.isVideo)) {
    try {
      qr[l.id] = await QRCode.toString(l.url, {
        type: "svg",
        margin: 0,
        errorCorrectionLevel: "M",
        color: { dark: "#160F2AFF", light: "#00000000" },
      });
    } catch {
      /* a malformed URL just gets no QR code */
    }
  }

  // Starting copy in Hebrew, all of it editable on the page.
  const summary = player.shortDescription?.trim() || trimSummary(player.aiSummary);
  let why = (player.strengths ?? "")
    .split(/\n|•|;/)
    .map((s) => s.replace(/^[-*\s]+/, "").trim())
    .filter(Boolean)
    .slice(0, 3);
  if (why.length === 0 && detail.scoutingReport) {
    const group = detail.scoutingReport.positionGroup ?? guessPositionGroup(player.mainPosition);
    const { strengths } = summarizePlayerScouting(buildAllAttributesData(detail.scoutingReport, group, "he"));
    why = strengths.slice(0, 3).map((s) => `${s.label}: ${(s.value * 2).toFixed(1)}/10`);
  }
  while (why.length < 3) why.push("");

  const activeContract = detail.contracts.find((c) => c.status === "ACTIVE");
  const isFree = player.status === "FREE_AGENT" || !activeContract;
  const status = isFree
    ? "שחקן חופשי"
    : activeContract?.endDate
      ? `תחת חוזה עד ${new Date(activeContract.endDate).getFullYear()}`
      : "";

  return (
    <VeraProposal
      playerId={id}
      clubOptions={clubOptions}
      name={basics.name}
      dataline={basics.dataline}
      age={basics.age}
      bornDate={basics.bornDate}
      positionCode={basics.positionCode}
      facts={basics.facts}
      hive={hive}
      links={links}
      defaultLinks={defaults}
      qr={qr}
      photoUrl={player.photoPath ?? null}
      initial={{ summary, why, status, availability: "", transfer: isFree ? "free_agent" : "fee" }}
      today={todayLabel()}
    />
  );
}
