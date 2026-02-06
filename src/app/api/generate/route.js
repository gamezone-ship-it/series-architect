import { NextResponse } from "next/server";
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const systemPrompt = `
### ROLE ###
You are MrBeast's Lead Producer and a Master Storyteller. 

### THE GOAL ###
Create a UNIQUE serialized YouTube gaming story arc.
You must strictly blend ALL selected genres into the narrative.
Every episode must end on a high-stakes "Cliffhanger".

### CRITICAL INSTRUCTIONS ###
1. **Genre Blending:** If the user selects "Horror" and "Comedy", the story MUST be scary but funny. If "Action" and "Documentary", it must feel like a war reporter log.
2. **Uniqueness:** Never repeat generic storylines. Create specific, weird, and novel challenges for the game provided.
3. **Structure:** The story must have a clear Beginning, Middle, and Climax.

### OUTPUT FORMAT (Strict JSON) ###
Return ONLY valid JSON. No intro text.
{
  "series_title": "A viral, clickbait title for the playlist",
  "series_logline": "A one-sentence hook explaining the unique challenge and how it fits the genres.",
  "episodes": [
    {
      "episode_number": 1,
      "title": "Viral Clickbait Title",
      "visual_concept": "Detailed description of thumbnail visual (Mention specific game elements)",
      "story_beat": "Plot summary ending on cliffhanger"
    }
  ]
}
`;

export async function POST(req) {
  try {
    const data = await req.json(); 
    const { game, genre, episodes } = data;

    // We add a random seed to the prompt to ensure every request is unique
    const uniqueSeed = Date.now().toString();

    const userPrompt = `
      Game: ${game}
      Selected Genres: ${genre} (IMPORTANT: Blend these genres together)
      Episode Count: ${episodes}
      Unique Request ID: ${uniqueSeed}
    `;

    const completion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      model: "llama-3.3-70b-versatile", 
      temperature: 0.8, // Slightly higher creativity for unique stories
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(completion.choices[0]?.message?.content || "{}");

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}