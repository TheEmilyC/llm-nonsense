import { MessageRole } from "@/app/_shared/schema";
import { CharacterRecord } from "@/app/character/_lib/schema";
import { ChatSession } from "@/app/chat/_lib/schema";
import { LorebookEntryIndex, LorebookReady } from "@/app/lorebook/_lib/schema";
import {
  ChatHistoryFragment,
  ContentFragment,
  InjectFragment,
  PromptInjectTag,
} from "@/app/prompt/_lib/schema";

type BuilderChatHistoryFragment = Pick<ChatHistoryFragment, "type">;

type BuilderContentFragment = Pick<
  ContentFragment,
  "content" | "role" | "type"
>;

type BuilderInjectFragment = Pick<
  InjectFragment,
  "injectTag" | "role" | "type"
> & {
  content: string;
};

interface BuildPromptFromChatParams {
  character: CharacterRecord;
  chat: ChatSession;
  lorebook?: LorebookReady;
  lorebookConstants?: string;
  lorebookContext?: string;
  regenerate?: boolean;
}

interface BuildSummaryPromptParams {
  lorebook?: LorebookReady;
  lorebookConstants?: string;
  lorebookContext?: string;
  messages: ChatMessage[];
}

type ChatMessage = { content: string; role: MessageRole };
type Fragment =
  | BuilderChatHistoryFragment
  | BuilderContentFragment
  | BuilderInjectFragment;

type FragmentTokenCount = Fragment & { tokens: number };

export class PromptBuilder {
  chatHistory: ChatMessage[] = [];
  currentTokens: number = 0;
  maxTokens: number;
  prompt: FragmentTokenCount[] = [];
  variables: Record<string, string> = {};

  constructor({
    maxTokens,
    promptSkeleton,
    variables,
  }: {
    maxTokens: number;
    promptSkeleton: Fragment[];
    variables?: Record<string, string>;
  }) {
    this.maxTokens = maxTokens;
    if (variables) this.variables = variables;
    for (const fragment of promptSkeleton) {
      if (fragment.type === "CHAT_HISTORY") {
        this.prompt.push({ ...fragment, tokens: 0 });
      }
      if (fragment.type === "INJECT") {
        this.prompt.push({
          ...fragment,
          content: "",
          injectTag: fragment.injectTag,
          tokens: 0,
        });
      }
      if (fragment.type === "CONTENT") {
        const hydreatedContent = hydratePrompt(
          fragment.content,
          this.variables,
        );
        const tokens = estimateTokens(hydreatedContent);
        if (!this.canAffordTokens(tokens))
          throw new Error("Prompt skeleton exceeds token limit");
        this.prompt.push({ ...fragment, content: hydreatedContent, tokens });
        this.currentTokens += tokens;
      }
    }
  }

  addToPrompt(injectTag: PromptInjectTag, content: string) {
    const fragment = this.prompt.find(
      (frag) => frag.type === "INJECT" && frag.injectTag === injectTag,
    );
    if (!fragment || fragment.type !== "INJECT") return;
    const hydreatedContent = hydratePrompt(content, this.variables);
    const tokens = estimateTokens(hydreatedContent);
    if (this.currentTokens + tokens > this.maxTokens)
      throw new Error("Content exceeds token limit");
    fragment.content += `\n${hydreatedContent}`;
    fragment.tokens += tokens;
    this.currentTokens += tokens;
  }

  build(): ChatMessage[] {
    return this.prompt.reduce<ChatMessage[]>((acc, fragment) => {
      if (fragment.type === "CHAT_HISTORY") {
        return acc.concat(this.chatHistory.reverse() ?? []);
      }

      const last = acc[acc.length - 1];
      if (last && last.role === fragment.role) {
        last.content += `\n${fragment.content}`;
      } else {
        acc.push({ content: fragment.content, role: fragment.role });
      }
      return acc;
    }, []);
  }

  canAfford(text: string): boolean {
    const tokens = estimateTokens(text);
    return this.canAffordTokens(tokens);
  }

  canAffordTokens(tokens: number): boolean {
    return this.currentTokens + tokens <= this.maxTokens;
  }

  injectChatHistory(messages: ChatMessage[]) {
    const fragment = this.prompt.find((frag) => frag.type === "CHAT_HISTORY");
    if (!fragment) return;
    for (const message of messages) {
      const tokens = estimateTokens(message.content);
      if (!this.canAffordTokens(tokens)) return;
      this.chatHistory.push(message);
      fragment.tokens += tokens;
      this.currentTokens += tokens;
    }
  }
}

export function buildLorebookUpdatePrompt(
  messages: ChatMessage[],
  lorebook: LorebookReady,
) {
  const promptBuilder = new PromptBuilder({
    maxTokens: 20000,
    promptSkeleton: [
      {
        content: `<instructions>
        <lore_update>
        Your job is to examine the text and produce update suggestions to existing lorebook files or new lorebook suggestions if the revelation is significant. Only incude new information in the following format:
        # [Entry Title]
        - New information revealed or changed by reveleations in the scene
        - Include enough detail that it can be incorporated into the lorebook entry without needing the origonal text as context
        - Also include suggestions of information that could be removed from the lorebook based on the scene revelations
        </lore_update>
        </instructions>
        <lore>`,
        role: "system",
        type: "CONTENT",
      },
      {
        content: "",
        injectTag: "LOREBOOK_ENTRIES",
        role: "system",
        type: "INJECT",
      },
      {
        content: "</lore>\n<scene>",
        role: "system",
        type: "CONTENT",
      },
      {
        type: "CHAT_HISTORY",
      },
      {
        content: "</scene>",
        role: "user",
        type: "CONTENT",
      },
    ],
  });

  const lorebookPrompt = lorebook.entries
    .map((idx) => `${idx.filename}  -  ${idx.summary}`)
    .join("\n");
  promptBuilder.addToPrompt("LOREBOOK_ENTRIES", lorebookPrompt);

  promptBuilder.injectChatHistory(messages);
  return promptBuilder.build();
}

export async function buildPromptFromChat({
  character,
  chat,
  lorebook,
  lorebookConstants,
  lorebookContext,
  regenerate,
}: BuildPromptFromChatParams): Promise<ChatMessage[]> {
  const promptBuilder = new PromptBuilder({
    maxTokens: chat.prompt.maxTokens,
    promptSkeleton: chat.prompt.promptFragments.map((frag) =>
      frag.type === "INJECT" ? { ...frag, content: "" } : frag,
    ),
    variables: {
      char: character.card.name,
      user: chat.persona?.name ?? "",
      world: chat.world?.name ?? "",
    },
  });

  const lastMessage = regenerate ? chat.messages[1] : chat.messages[0];

  const chatHistory = regenerate
    ? chat.messages.slice(2)
    : chat.messages.slice(1);

  promptBuilder.addToPrompt("LAST_MESSAGE", lastMessage.content);
  promptBuilder.addToPrompt(
    "CHARACTER_DESCRIPTION",
    character.card.description,
  );
  promptBuilder.addToPrompt(
    "CHARACTER_PERSONALITY",
    character.card.personality,
  );
  promptBuilder.addToPrompt("CHARACTER_SCENARIO", character.card.scenario);

  if (chat.persona) {
    promptBuilder.addToPrompt("PERSONA_DESCRIPTION", chat.persona.description);
  }
  if (chat.world) {
    promptBuilder.addToPrompt("WORLD_DESCRIPTION", chat.world.description);
  }
  if (lorebook) {
    if (lorebookContext)
      promptBuilder.addToPrompt("LOREBOOK_CONTEXT", lorebookContext);
    if (lorebookConstants)
      promptBuilder.addToPrompt("LOREBOOK_CONSTANT", lorebookConstants);
    const entriesPrompt = buildLorePromptTable(lorebook.entries);
    promptBuilder.addToPrompt("LOREBOOK_ENTRIES", entriesPrompt);
    const memoryPrompt = buildLorePromptTable(lorebook.memories);
    promptBuilder.addToPrompt("LOREBOOK_MEMORIES", memoryPrompt);
  }
  promptBuilder.injectChatHistory(chatHistory);

  return promptBuilder.build();
}

export function buildSummaryPrompt({
  lorebook,
  lorebookConstants,
  lorebookContext,
  messages,
}: BuildSummaryPromptParams): ChatMessage[] {
  // TODO: Remove hardcoded prompt
  const promptBuilder = new PromptBuilder({
    maxTokens: 20000,
    promptSkeleton: [
      {
        content: `<instructions>
        <summary_creation>
        Your first job is to create a summary of this creative fiction scene. Create a beat-by-beat summary of the scene that *replaces reading the full scene* while preserving all plot-relevant nuance and reads like a clean, structured scene log — concise yet complete. This summary will be your memory of this scene in the future. Be token-efficient: exercise judgment as to whether or not an interaction is flavor-only or truly affects the plot. Flavor scenes (interaction detail that does not advance plot)
        
        Write in **past tense**, **third-person**, and exclude all [OOC] or meta discussion. Use concrete nouns (e.g., "rice cooker” > "appliance"). Only use adjectives/adverbs when they materially affect tone, emotion, or characterization. Focus on **cause → intention → reaction → consequence** chains for clarity and compression. The summary should be formatted like:
        # [Scene Title]
        **Timeline**: (day/time)
          
        ## Story Beats
        - Present all major actions, revelations, and emotional or magical shifts in order.
        - Capture clear cause-effect logic: what triggered what, and why it mattered.
        - Only include plot-affecting interactions and do not capture flavor-only beats.
          
        ## Character Dynamics
        - Summarize how each character's **motives, emotions, and relationships** evolved.
        - Include subtext, tension, or silent implications.
        - Highlight key beats of conflict, vulnerability, trust, or power shifts.

        ## Key Exchanges
        - Include only pivotal dialogue that defines tone, emotion, or change.
        - Attribute speakers by name; keep quotes short but exact.
        - BE SELECTIVE. Maximum of 8 quotes.

        ## Outcome & Continuity
        - Detail resulting **decisions, emotional states, physical/magical effects, or narrative consequences**.
        - Include all elements that influence future continuity (knowledge, relationships, injuries, promises, etc.).
        - Note any unresolved threads or foreshadowed elements.
          
        Write compactly but completely — every line should add new information or insight. Synthesize redundant actions or dialogue into unified cause-effect-emotion beats.
        Favor compression over coverage whenever the two conflict; omit anything that can be inferred from context or established characterization.

        Also create a short scentence describing the scene for the synopsis IE: 'Luke Skywalker in his X-Wing blows up the death star in the nick of time, saving the rebellion'"
        </summary_creation>
        </instructions>
        <lore>`,
        role: "system",
        type: "CONTENT",
      },
      {
        content: "",
        injectTag: "LOREBOOK_ENTRIES",
        role: "system",
        type: "INJECT",
      },
      {
        content: "</lore>\n<scene>",
        role: "system",
        type: "CONTENT",
      },
      {
        type: "CHAT_HISTORY",
      },
      {
        content: "</scene>",
        role: "user",
        type: "CONTENT",
      },
    ],
  });

  if (lorebook) {
    if (lorebookContext)
      promptBuilder.addToPrompt("LOREBOOK_CONTEXT", lorebookContext);
    if (lorebookConstants)
      promptBuilder.addToPrompt("LOREBOOK_CONSTANT", lorebookConstants);
    const entriesPrompt = buildLorePromptTable(lorebook.entries);
    promptBuilder.addToPrompt("LOREBOOK_ENTRIES", entriesPrompt);
    const memoryPrompt = buildLorePromptTable(lorebook.memories);
    promptBuilder.addToPrompt("LOREBOOK_MEMORIES", memoryPrompt);
  }

  promptBuilder.injectChatHistory(messages);
  return promptBuilder.build();
}

export function hydratePrompt(
  prompt: string,
  variables: Record<string, string>,
): string {
  return prompt.replace(/{{(\w+(?:\.\w+)*)}}/g, (match, key) => {
    if (key in variables) {
      return variables[key];
    } else {
      console.warn(`unreplaced variable:{{${key}}}`);
      return "";
    }
  });
}

function buildLorePromptTable(entries: LorebookEntryIndex[]): string {
  let entriesPrompt = "";
  if (entries.length > 0) {
    entriesPrompt +=
      "| File Name | Aliases | Relevant Characters | Summary |\n| --- | --- | --- | --- |\n";
    entriesPrompt += entries
      .map(
        (ent) =>
          `| ${ent.filename} | ${ent.aliases?.join(", ")} | ${ent.characters?.join(", ")} | ${ent.summary} |`,
      )
      .join("\n");
  }

  return entriesPrompt;
}

function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}
