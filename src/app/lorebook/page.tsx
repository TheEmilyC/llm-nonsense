import { LorebookList } from "@/app/lorebook/_components/lorebook-list";
import { getLorebookEntityDtoList } from "@/app/lorebook/_lib/data";

export const dynamic = "force-dynamic";

export default async function LorebookPage() {
  const lorebooks = await getLorebookEntityDtoList();
  return <LorebookList lorebooks={lorebooks} />;
}
