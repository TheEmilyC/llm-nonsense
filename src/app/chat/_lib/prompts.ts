import dedent from "dedent";

export const summaryInstructions = dedent`
<instructions>
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
</instructions>`;

export const lorebookUpdatePrompt = dedent`
<instructions>
Your job is to examine the text and produce update suggestions to existing lorebook files or new lorebook suggestions if the revelation is significant. Only incude new information in the following format:
# [Entry Title]
    - New information revealed or changed by reveleations in the scene
    - Include enough detail that it can be incorporated into the lorebook entry without needing the origonal text as context
    - Also include suggestions of information that could be removed from the lorebook based on the scene revelations
</instructions>`;
