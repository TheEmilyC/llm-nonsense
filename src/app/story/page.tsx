import { StoriesList } from "@/app/story/_components/story-list";
import { getStoryList } from "@/app/story/_lib/data";

export default async function StoriesPage() {
  const stories = await getStoryList();
  return <StoriesList stories={stories} />;
}
