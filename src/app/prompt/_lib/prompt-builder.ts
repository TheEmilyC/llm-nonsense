import { MessageRole } from "@/app/_shared/schema";
import { getCharacterRecord } from "@/app/character/_lib/data";
import { ChatSession } from "@/app/chat/_lib/schema";
import { getLorebookById } from "@/app/lorebook/_lib/data";
import {
  Lorebook,
  LorebookReady,
  LorebookStatus,
} from "@/app/lorebook/_lib/schema";
import { PromptFragmentType, PromptInjectTag } from "@/app/prompt/_lib/schema";
import { NotFoundError } from "@/lib/error";

interface BuildPromptFromChatParams {
  chat: ChatSession;
  regenerate?: boolean;
}

type ChatHistoryFragment = {
  type: PromptFragmentType.chatHistory;
};

type ChatMessage = { content: string; role: MessageRole };

type ContentFragment = {
  content: string;
  role: MessageRole;
  type: PromptFragmentType.content;
};

type Fragment = ChatHistoryFragment | ContentFragment | InjectFragment;

type FragmentTokenCount = Fragment & { tokens: number };
type InjectFragment = {
  content: string;
  injectTag: PromptInjectTag;
  role: MessageRole;
  type: PromptFragmentType.inject;
};

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
      if (fragment.type === PromptFragmentType.chatHistory) {
        this.prompt.push({ ...fragment, tokens: 0 });
      }
      if (fragment.type === PromptFragmentType.inject) {
        this.prompt.push({
          ...fragment,
          content: "",
          injectTag: fragment.injectTag,
          tokens: 0,
        });
      }
      if (fragment.type === PromptFragmentType.content) {
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
      (frag) =>
        frag.type === PromptFragmentType.inject && frag.injectTag === injectTag,
    );
    if (!fragment || fragment.type !== PromptFragmentType.inject) return;
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
      if (fragment.type === PromptFragmentType.chatHistory) {
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
    const fragment = this.prompt.find(
      (frag) => frag.type === PromptFragmentType.chatHistory,
    );
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
        type: PromptFragmentType.content,
      },
      {
        content: "",
        injectTag: PromptInjectTag.lorebook,
        role: "system",
        type: PromptFragmentType.inject,
      },
      {
        content: "</lore>\n<scene>",
        role: "system",
        type: PromptFragmentType.content,
      },
      {
        type: PromptFragmentType.chatHistory,
      },
      {
        content: "</scene>",
        role: "user",
        type: PromptFragmentType.content,
      },
    ],
  });

  const lorebookPrompt = lorebook.index
    .map((idx) => `${idx.filename}  -  ${idx.summary}`)
    .join("\n");
  promptBuilder.addToPrompt(PromptInjectTag.lorebook, lorebookPrompt);

  promptBuilder.injectChatHistory(messages);
  return promptBuilder.build();
}

export async function buildPromptFromChat({
  chat,
  regenerate,
}: BuildPromptFromChatParams): Promise<ChatMessage[]> {
  const character = await getCharacterRecord(chat.character.id);
  if (!character) throw new NotFoundError("Character", chat.character.id);
  const lorebook = chat.lorebookId
    ? await getLorebookById(chat.lorebookId)
    : null;

  const promptBuilder = new PromptBuilder({
    maxTokens: chat.prompt.maxTokens,
    promptSkeleton: chat.prompt.promptFragments.map((frag) =>
      frag.type === PromptFragmentType.chatHistory
        ? { type: PromptFragmentType.chatHistory }
        : frag.type === PromptFragmentType.content
          ? frag
          : {
              content: "",
              injectTag: frag.injectTag,
              role: frag.role,
              type: PromptFragmentType.inject,
            },
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

  promptBuilder.addToPrompt(PromptInjectTag.lastMessage, lastMessage.content);
  promptBuilder.addToPrompt(
    PromptInjectTag.characterDescription,
    character.card.description,
  );
  promptBuilder.addToPrompt(
    PromptInjectTag.characterPersonality,
    character.card.personality,
  );
  promptBuilder.addToPrompt(
    PromptInjectTag.characterScenario,
    character.card.scenario,
  );

  if (chat.persona) {
    promptBuilder.addToPrompt(
      PromptInjectTag.personaDescription,
      chat.persona.description,
    );
  }
  if (chat.world) {
    promptBuilder.addToPrompt(
      PromptInjectTag.worldDescription,
      chat.world.description,
    );
  }
  if (lorebook && lorebook.status === LorebookStatus.Ready) {
    const lorebookPrompt = lorebook.index
      .map((idx) => `${idx.filename}  -  ${idx.summary}`)
      .join("\n");
    promptBuilder.addToPrompt(PromptInjectTag.lorebook, lorebookPrompt);
  }
  promptBuilder.injectChatHistory(chatHistory);

  return promptBuilder.build();
}

export function buildSummaryPrompt(
  messages: ChatMessage[],
  lorebook?: Lorebook,
): ChatMessage[] {
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

        ## Outcome & Continuity
        - Detail resulting **decisions, emotional states, physical/magical effects, or narrative consequences**.
        - Include all elements that influence future continuity (knowledge, relationships, injuries, promises, etc.).
        - Note any unresolved threads or foreshadowed elements.
          
        Write compactly but completely — every line should add new information or insight. Synthesize redundant actions or dialogue into unified cause-effect-emotion beats.
        Favor compression over coverage whenever the two conflict; omit anything that can be inferred from context or established characterization.
        </summary_creation>
        </instructions>
        <lore>`,
        role: "system",
        type: PromptFragmentType.content,
      },
      {
        content: "",
        injectTag: PromptInjectTag.lorebook,
        role: "system",
        type: PromptFragmentType.inject,
      },
      {
        content: "</lore>\n<scene>",
        role: "system",
        type: PromptFragmentType.content,
      },
      {
        type: PromptFragmentType.chatHistory,
      },
      {
        content: "</scene>",
        role: "user",
        type: PromptFragmentType.content,
      },
    ],
  });

  if (lorebook && lorebook.status === LorebookStatus.Ready) {
    const lorebookPrompt = lorebook.index
      .map((idx) => `${idx.filename}  -  ${idx.summary}`)
      .join("\n");
    promptBuilder.addToPrompt(PromptInjectTag.lorebook, lorebookPrompt);
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

function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}
