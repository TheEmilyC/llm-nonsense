import { WorldList } from "@/app/world/_components/world-list";
import { getWorldList } from "@/app/world/_lib/data";

export default async function WorldPage() {
  const worlds = await getWorldList();
  return <WorldList worlds={worlds} />;
}
