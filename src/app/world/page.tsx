import { WorldList } from "@/app/world/_components/world-list";
import { getWorldList } from "@/app/world/_lib/data";
import { buildWorldImageUrl } from "@/lib/image";

export default async function WorldPage() {
  const worlds = (await getWorldList()).map((world) => ({
    id: world.id,
    name: world.name,
    imageUrl: buildWorldImageUrl({ id: world.id, imgHash: world.imageHash }),
  }));
  return <WorldList worlds={worlds} />;
}
