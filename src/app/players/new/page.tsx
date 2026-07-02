import PlayerForm from "@/components/PlayerForm";
import { getAllClubs } from "@/lib/data";
import { createPlayer } from "@/lib/actions";

export default async function NewPlayerPage() {
  const clubs = await getAllClubs();
  return (
    <div className="max-w-4xl space-y-4">
      <h1 className="text-2xl font-bold">שחקן חדש</h1>
      <PlayerForm clubs={clubs} action={createPlayer} submitLabel="צור שחקן" />
    </div>
  );
}
