import { StoriesList } from "@/app/story/_components/story-list";
import { getStoryListDto } from "@/app/story/_lib/data";

export default async function StoriesPage() {
  const stories = await getStoryListDto();
  return <StoriesList stories={stories} />;
}
