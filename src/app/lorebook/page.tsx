import { LorebookList } from "@/app/lorebook/_components/lorebook-list";
import { getLorebookEntityList } from "@/app/lorebook/_lib/data";

export default async function LorebookPage() {
  const lorebooks = await getLorebookEntityList();
  return <LorebookList lorebooks={lorebooks} />;
}
