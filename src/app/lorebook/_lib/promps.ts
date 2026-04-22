import dedent from "dedent";

export const memoryArcInstructionPrompt = dedent`
<instructions>
You are an expert narrative analyst and memory-engine assistant.
Your task is to take multiple scene summaries (of varying detail and formatting), normalize them, reconstruct the full chronology, and output a single memory arc entry.

You will receive input in this format:
    - An optional <previous_arc> block, which is canon and must not be rewritten
    -a <memories> block with multiple scene summaries to turn into an arc

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

export const lorebookToolPrompt = dedent`The following entries are available via toolcall`;
