import dedent from "dedent";

export const memoryArcInstructionPrompt = dedent`
<instructions>
You are an expert narrative analyst and memory-engine assistant.
Your task is to take multiple scene summaries (of varying detail and formatting), normalize them, reconstruct the full chronology, and output a single memory arc entry.

You will receive input in this format:
    - A list of lorebook entries in the <lorebook_entries> block that can be accessed for additional information if needed
    - An optional <previous_arc> block, which is canon and must not be rewritten
    - a <memories> block with multiple scene summaries to turn into an arc

Notes:
- Respect chronology using ORDER (ascending).
- If some memories do not fit the arc, place them in unassigned_memories with a short reason.
- Do not repeat text from PREVIOUS ARC. Treat it as canon; continue consequences only if relevant in the new memories.
<process>
STEP 1 — UNIFIED STORY (internal only)
- Combine ALL memories into a single chronological retelling.
- Ignore OOC/meta content.
- Preserve plot-relevant events, character choices, emotional shifts, decisions, consequences, conflicts, promises, boundary negotiations.
- Exclude flavour-only content unless it affects future behaviour.
- Normalize to past-tense, third-person.
- Focus on cause → intention → reaction → consequence chains.
- Do NOT output this unified story.

STEP 2 — IDENTIFY STORY ARCS
- From the unified story, identify a self-contained arc that represents a significant narrative movement.

STEP 3 — ARC SUMMARY FORMAT
- Write the arc summary in this format
<arc_summary_format>
# [Arc Title]
Time period: What timeframe the arc covers (e.g. "March 3-10, 2024", "Week of July 15, 2023")

## Major Beats
- 3-7 bullets capturing the major plot movements of this arc
- Focus on cause → effect logic
- Include only plot-affecting events

## Character Dynamics
- 1-2 paragraphs describing how the characters' emotions, motives, boundaries, or relationship changed
- Include subtext, tension shifts, power exchange changes, new trust/vulnerabilities, or new conflicts
- Include silent implications if relevant

## Key Exchanges
- Up to 8 short, exact quotes
- Only include dialogue that materially shifted tone, emotion, or relationship dynamics

## Outcome & Continuity
- 4-8 bullets capturing:
  - decisions
  - promises
  - new emotional states
  - new routines/rituals
  - injuries or physical changes
  - foreshadowed future events
  - unresolved threads
  - permanent consequences
</arc_summary_format>
</process>
</instructions>
`;

export const lorebookToolPrompt = dedent`The following entries are available via tool call`;

export const lorebookUpdatePrompt = dedent`
<instructions>
Your job is to examine the text and produce update suggestions to existing lorebook files or new lorebook suggestions if the revelation is significant. Only include new information in the following format:
# [Entry Title]
    - New information revealed or changed by revelations in the scene
    - Include enough detail that it can be incorporated into the lorebook entry without needing the original text as context
    - Also include suggestions of information that could be removed from the lorebook based on the scene revelations
</instructions>`;

export const castOfCharactersPrompt = dedent`
You are a skilled reporter with a clear eye for judging the importance of NPCs to the plot. 
Step 1: Track the timeline as closely as possible, prefer exact dates (BEST: [\`May 26 2023 AD\`, \`18 ABY\`, \`Third Frostmoon, 14th day, in the 412th Hallowing\`], OKAY: [\`3 days after: <1 sentence event description>\`, \`Winter, date unknown\`] BAD:[\`"the 3rd of June, 47 ABY"\`, \`"Day 4,729,103"\`, \`The same day Ludwig closes on Windmere while Leoric acts to sway the council\`]
Step 2: Keep a running list of major and minor plot threads, and how long each has gone without an update. Include a list of characters that are involved in the plot thread. If this scene advanced one or more plot threads update them and reset their turn counters to 0. If this scene didn't touch a plot thread increment its counter by 1.
Step 2: Review the scene and either add or update plot-related characters to the cast of characters report. The descriptions should focus on their personality and long term goals, instead of focusing on the specifics of scene. 
Step 3: This list should be kept in order of importance to the plot, so it may need to be reordered.
Step 4: Include the font colour used for each character

<format>
**Timeline:** Date of the scene

## Major Plot Threads (0 turns)
A short 3-4 sentence description of the major plot thread driving the central story.

## Minor Plot Threads
- A short 1-2 sentence description of the minor plot thread. (3 turns) [character 1, character 2]
- A short 1-2 sentence description of the minor plot thread. (1 turns) [character 2, character 3]

## Characters
(In order of importance to the plot)
- Person 1(#012345): 1-2 sentence description of character personality and long term goals
- Person 2(#6789AB): 1-2 sentence description of character personality and long term goals
</format>`;

export const prefetchPrompt = dedent`Examine the following chat history and fetch relevant entries from the list provided`;
export const prefetchTaskPrompt = dedent`<task>Your task is to examine this scene and select the most relevant lorebook entries</task>`;

export const lorebookEntriesContextPrompt = dedent`Contains general information about the world, characters, world mechanics, ect:`;
export const lorebookMemoriesContextPrompt = dedent`Memories are summaries of previous story beats, Arcs are summarized memories of completed storylines:`;

export const lorebookUpdateDiscoveryPrompt = dedent`
<instructions>
You match extracted lore facts against existing lorebook entries to determine which entries should be reviewed for potential updates.

You will be given:
- A list of atomic lore facts extracted from one or more scenes in the <extracted_facts> block
- A list of existing lorebook entries, each with a filename and a summary in the <lorebook_entries> block

Your job is to identify which existing entries are likely affected by these facts, and to flag any facts that don't correspond to any existing entry (suggesting a new entry may be needed).

## What counts as a match

An entry should be flagged as a candidate when one or more facts:
- Add new information to a topic the entry already covers
- Modify or contradict information the entry contains
- Mention an entity, location, or concept the entry is about

You do not need to be certain — reconciliation will examine each candidate entry in detail and decide whether updates are actually warranted. Lean toward inclusion when there's plausible relevance.

## Multiple facts per entry

A single entry can be motivated by multiple facts. List all relevant fact indices for each entry. Do not create duplicate candidates for the same entry.

## When no entry matches

If a fact establishes information about a topic that no existing entry covers — a newly named character, a previously unmentioned location, an unrecorded faction — flag it under \`newEntryNeeded\` with a brief description of what the new entry would be about. Do not force such facts into loosely related existing entries.

## When facts don't need any entry

Some facts may be too minor, too transient, or too tangential to warrant a lorebook entry at all. It is acceptable for a fact to appear in neither candidates nor newEntryNeeded. The downstream pipeline will simply not act on those facts.

## Match on summaries, not filenames alone

Entry filenames may be terse or use conventions that don't reflect content (e.g. \`char_001.md\`). Use the summaries as your primary signal for what each entry covers. Filenames are useful for disambiguation but should not drive matching on their own.
</instructions>`;

export const lorebookNewEntrySuggestionPrompt = dedent`
<instructions>
You draft a new lorebook entry for a topic that has no existing entry.

You will be given:
- A proposed topic for the new entry in the <proposed_topic> block
- A list of facts that motivate this new entry in the <discoverd_facts> block

Your job is to produce the full content for a new lorebook entry based on these facts.

## Tool use

You can call \`getLorebookEntries\` to retrieve existing lorebook entries. Use this to understand the style, structure, and level of detail used in the lorebook so your new entry is consistent. Do not browse the lorebook out of curiosity. You have a hard limit on tool calls per run.

## Content guidelines

- Write in the same style and structure as existing lorebook entries
- Include all information supported by the provided facts
- For facts marked \`(implied)\`, reflect their uncertain nature in the wording
- Organize content with markdown headers if the entry has enough substance to warrant sections
- Do not invent information beyond what the facts support
- Include enough context that the entry is useful standalone, without needing to reference the original scene

## Output

Produce the full markdown content for the entry and a brief reasoning for why this entry is needed.
</instructions>`;

export const lorebookUpdateSuggestionPrompt = dedent`
<instructions>
You review a single lorebook entry against extracted facts and propose specific updates.

You will be given:
- One existing lorebook entry (filename and its current content, plus its outgoing links and backlinks) in the <existing_entry> block
- A list of facts that discovery identified as potentially relevant to this entry in the <discoverd_facts> block

Your job is to determine whether each fact warrants an update to the entry, and to produce structured update proposals.

## Tool use

You can call \`getLorebookEntries\` to retrieve any lorebook entry. Use this sparingly — only follow a link when you genuinely need that related entry's content to decide whether a fact represents new information or already-established information. Do not browse the lorebook out of curiosity. You have a hard limit on tool calls per run.

The candidate entry's content is provided directly in this prompt — you do not need to fetch it.

## Proposal types

For each fact, decide which of these applies:

**append** — The fact adds new information to the entry that fits naturally alongside existing content. Use this when the entry doesn't currently say anything contradictory and the new information would be additive.

**modify** — The fact updates or refines existing information in the entry. The existing text needs to change. You must identify the specific existing text that should be replaced (currentContent) and what it should become (proposedContent).

**conflict** — The fact directly contradicts existing entry content, and the contradiction is not obviously a retcon you should silently resolve. Flag this for the user to decide. Do not propose a resolution — describe the conflict and let the user choose.

**no_change** — The fact does not warrant any update to this entry. Use this when the fact is already covered by existing content, when it's too minor to record, or when discovery flagged the entry but the fact actually pertains to a different topic.

## Granularity

One fact may produce one proposal. Multiple facts may share a single proposal if they collectively motivate the same change. List all relevant fact indices for each proposal.

## Match facts to existing content carefully

Before proposing an append, check whether the entry already contains equivalent information in different wording. If "Maren is from the Ashlands" is already conveyed by "Maren grew up in the desert reaches", that's not a new fact to append — it's no_change.

## Implied facts

Facts marked \`(implied)\` represent inferences rather than stated information. Treat these conservatively — implied facts should rarely produce modify or conflict proposals against explicit existing content. They may justify append proposals when the entry has no contrary information, but the proposed content should reflect the implied/uncertain nature ("Maren appears uncomfortable around open fire" rather than "Maren fears fire").

## Reasoning field

For every proposal, briefly explain why you chose this update type and content. The user will see this reasoning in the review UI. Be specific and concise — one or two sentences.
</instructions>`;
