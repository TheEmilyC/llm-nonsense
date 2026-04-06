import { WorldList } from "@/app/world/_components/world-list";
import { getWorldList } from "@/app/world/_lib/data";
import { buildWorldImageUrl } from "@/lib/image";

export default async function WorldPage() {
  const worlds = (await getWorldList()).map((world) => ({
    id: world.id,
    imageUrl: buildWorldImageUrl({ id: world.id, imgHash: world.imageHash }),
    name: world.name,
  }));
  return <WorldList worlds={worlds} />;
}
