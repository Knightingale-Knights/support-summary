const SYSTEM_PROMPT = `You are drafting an NDIS participant support summary for Knightingale, a care staffing agency.
You will be given a participant's name, support type and setting, and a set of dated progress notes from the last 3 months.
Write a professional, warm support summary in the same structure as Knightingale's existing template.

Respond with ONLY valid JSON, no markdown fences, no commentary, matching exactly this shape:

{
  "overview": "1-2 sentence overview paragraph",
  "sessions": [ { "date": "DD/MM", "summary": "1-2 sentence session summary" } ],
  "summaryOfWork": [ { "heading": "Theme heading", "body": "1-3 sentence paragraph" } ],
  "workerReflection": { "quote": "short first-person quote from the support worker's perspective, or empty string if not enough material", "author": "support worker name if known, else empty string" },
  "keyObservations": [ "short observation" ],
  "recommendations": [ "short recommendation" ]
}

Guidelines:
- Use only information present in the notes. Do not invent events, names, or clinical claims.
- Group summaryOfWork into 3-5 sensible themes drawn from the actual notes (e.g. community access, social engagement, wellbeing, relationships), not a fixed list.
- keyObservations and recommendations should be grounded in patterns actually visible across the notes.
- Keep language plain and person-centred.`;

function buildUserPrompt({ participantName, supportType, setting, notes }) {
  const noteLines = notes
    .map((n) => `${new Date(n.date).toLocaleDateString("en-AU")}: ${n.summary}`)
    .join("\n");

  return `Participant: ${participantName}
Support type: ${supportType || "Not specified"}
Setting: ${setting || "Not specified"}
Number of notes: ${notes.length}

Progress notes:
${noteLines}`;
}

function extractJson(text) {
  const cleaned = text.replace(/```json|```/g, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch (err) {
    throw new Error(`Failed to parse Claude JSON output: ${err.message}. Raw text: ${cleaned.slice(0, 500)}`);
  }
}

async function draftSummaryContent({ participantName, supportType, setting, notes }) {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY env var is not set");
  }

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01"
    },
    body: JSON.stringify({
      model: process.env.ANTHROPIC_MODEL || "claude-sonnet-5",
      max_tokens: 9999,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: buildUserPrompt({ participantName, supportType, setting, notes })
        }
      ]
    })
  });

  if (!response.ok) {
    throw new Error(`Claude API error: ${response.status} ${await response.text()}`);
  }

  const data = await response.json();
  const textBlock = (data.content || []).find((b) => b.type === "text");
  if (!textBlock) {
    throw new Error(`Claude API returned no text block: ${JSON.stringify(data)}`);
  }
  return extractJson(textBlock.text);
}

module.exports = { draftSummaryContent };
