import { PromptList } from "@/app/prompt/_component/prompt-list";
import { getPromptList } from "@/app/prompt/_lib/data";

export default async function PromptPage() {
  const prompts = await getPromptList();
  return <PromptList prompts={prompts} />;
}
