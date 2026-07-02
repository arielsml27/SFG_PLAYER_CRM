import PlayerForm from "@/components/PlayerForm";
import { getAllClubs, getPlayerDetail } from "@/lib/data";
import { updatePlayer } from "@/lib/actions";
import { notFound } from "next/navigation";

export default async function EditPlayerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [clubs, detail] = await Promise.all([getAllClubs(), getPlayerDetail(id)]);
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
