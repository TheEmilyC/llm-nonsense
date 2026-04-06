import z from "zod";

// V3 character card community standard
export const characterCardSchema = z.looseObject({
  avatar: z.string(),
  chat: z.string(),
  create_date: z.coerce.date(),
  creator_notes: z.string(),
  creatorcomment: z.string(),
  description: z.string(),
  fav: z.boolean(),
  first_mes: z.string(),
  mes_example: z.string(),
  name: z.string().min(1),
  personality: z.string(),
  scenario: z.string(),
  spec: z.string(),
  spec_version: z.string(),
  tags: z.string().array(),
  talkativeness: z.string(),
});
export type CharacterCard = z.infer<typeof characterCardSchema>;
