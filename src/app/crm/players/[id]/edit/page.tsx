import PlayerForm from "@/components/PlayerForm";
import { getAllClubs, getPlayerDetail } from "@/lib/data";
import { getCurrentCrmUser } from "@/lib/current-user";
import { getVisiblePlayerIds } from "@/lib/permissions";
import { updatePlayer } from "@/lib/actions";
import { notFound } from "next/navigation";

export default async function EditPlayerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const currentUser = await getCurrentCrmUser();
  const visiblePlayerIds = currentUser ? await getVisiblePlayerIds(currentUser) : [];
  const [clubs, detail] = await Promise.all([getAllClubs(), getPlayerDetail(id, visiblePlayerIds)]);
  if (!detail) notFound();

  const boundUpdate = updatePlayer.bind(null, id);

  return (
    <div className="max-w-4xl space-y-4">
      <h1 className="text-2xl font-bold">
        עריכת {detail.player.firstName} {detail.player.lastName}
      </h1>
      <PlayerForm player={detail.player} clubs={clubs} action={boundUpdate} submitLabel="שמור שינויים" />
    </div>
  );
}
