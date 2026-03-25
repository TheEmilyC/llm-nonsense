import z from "zod";

// V3 character card community standard
export const characterCardSchema = z.looseObject({
  name: z.string().min(1),
  description: z.string(),
  personality: z.string(),
  scenario: z.string(),
  first_mes: z.string(),
  mes_example: z.string(),
  creatorcomment: z.string(),
  avatar: z.string(),
  chat: z.string(),
  talkativeness: z.string(),
  fav: z.boolean(),
  tags: z.string().array(),
  spec: z.string(),
  spec_version: z.string(),
  create_date: z.coerce.date(),
  creator_notes: z.string(),
});
export type CharacterCard = z.infer<typeof characterCardSchema>;
