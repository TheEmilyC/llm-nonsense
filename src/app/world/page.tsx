import { WorldList } from "@/app/world/_components/world-list";
import { getWorldListDto } from "@/app/world/_lib/data";

export default async function WorldPage() {
  const worlds = await getWorldListDto();
  return <WorldList worlds={worlds} />;
}
