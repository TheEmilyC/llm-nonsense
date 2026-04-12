import { PromptList } from "@/app/prompt/_component/prompt-list";
import { getPromptListDto } from "@/app/prompt/_lib/data";

export default async function PromptPage() {
  const prompts = await getPromptListDto();
  return <PromptList prompts={prompts} />;
}
