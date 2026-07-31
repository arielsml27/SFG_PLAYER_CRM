import { notFound } from "next/navigation";
import { getPlayerDetail } from "@/lib/data";
import ExtendedQuestionnaire from "@/components/landing/ExtendedQuestionnaire";

export default async function QuestionnairePage({ params }: { params: Promise<{ playerId: string }> }) {
  const { playerId } = await params;
  const detail = await getPlayerDetail(playerId);
  if (!detail) notFound();

  return <ExtendedQuestionnaire playerId={playerId} firstName={detail.player.firstName} />;
}
