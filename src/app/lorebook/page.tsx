import { LorebookList } from "@/app/lorebook/_components/lorebook-list";
import { getLorebookDbList } from "@/app/lorebook/_lib/data";

export default async function LorebookPage() {
  const lorebooks = await getLorebookDbList();
  return <LorebookList lorebooks={lorebooks} />;
}
