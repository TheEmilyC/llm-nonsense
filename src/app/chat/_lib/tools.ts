import { tool } from "ai";
import z from "zod";

export const rollDiceTool = tool({
  description: "Roll dice or generate random numbers for one or more named rolls",
  execute: async ({ rolls }) => {
    return rolls
      .map(({ name, min, max }) => {
        const result = Math.floor(Math.random() * (max - min + 1)) + min;
        return `${name}: ${result}`;
      })
      .join("\n");
  },
  inputSchema: z.object({
    rolls: z
      .array(
        z.object({
          max: z.number().int().describe("Maximum value (inclusive)"),
          min: z.number().int().describe("Minimum value (inclusive)"),
          name: z.string().describe("Label for this roll"),
        }),
      )
      .describe("List of named rolls to perform"),
  }),
});
