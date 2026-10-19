"use server";

import Anthropic from "@anthropic-ai/sdk";
import { getCurrentCrmUser } from "@/lib/current-user";

export type ProposalTexts = {
  summary: string;
  why: string[];
  status: string;
  availability: string;
  facts: Record<string, string>;
};

const LANG_INSTRUCTIONS: Record<string, string> = {
  en: "English",
  sr: "Serbian, written in the Latin script (latinica)",
};

let client: Anthropic | null = null;
function getClient(): Anthropic {
  if (!client) client = new Anthropic();
  return client;
}

// Translates the Hebrew proposal copy into the target language for a club
// abroad. Facts are short field values (club name, league, citizenship), so
// club and place names are rendered the way that language normally writes them.
export async function translateProposalTexts(
  target: "en" | "sr",
  source: ProposalTexts
): Promise<{ ok: true; texts: ProposalTexts } | { ok: false; error: string }> {
  const user = await getCurrentCrmUser();
  if (!user) return { ok: false, error: "צריך להתחבר מחדש למערכת." };
  if (!LANG_INSTRUCTIONS[target]) return { ok: false, error: "שפה לא נתמכת." };

  const prompt = `You translate a one-page football player proposal that a licensed agency (VERA) sends to clubs.
Translate every string value in the JSON below from Hebrew into ${LANG_INSTRUCTIONS[target]}.

Rules:
- Keep the exact same JSON structure and keys. Translate values only.
- Keep every number, date, score and statistic exactly as written.
- Club, league and place names: use the spelling that language normally uses (for example "מכבי תל אביב" becomes "Maccabi Tel Aviv").
- Professional, factual football language a sporting director would use. Keep each "why" item to one short line.
- Never use em dashes. Use commas or a middle dot instead.
- If a value is empty, keep it empty.
- Output only the JSON object, nothing else.

${JSON.stringify(source, null, 2)}`;

  try {
    const response = await getClient().messages.create({
      model: "claude-opus-4-8",
      max_tokens: 2000,
      messages: [{ role: "user", content: prompt }],
    });
    const text = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("")
      .trim();
    const json = text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1);
    const parsed = JSON.parse(json) as ProposalTexts;
    return {
      ok: true,
      texts: {
        summary: String(parsed.summary ?? ""),
        why: Array.isArray(parsed.why) ? parsed.why.map(String) : [],
        status: String(parsed.status ?? ""),
        availability: String(parsed.availability ?? ""),
        facts: parsed.facts && typeof parsed.facts === "object" ? parsed.facts : {},
      },
    };
  } catch (err) {
    if (err instanceof Anthropic.AuthenticationError) return { ok: false, error: "מפתח ה-API של Anthropic לא תקין." };
    if (err instanceof Anthropic.APIError && /credit balance/i.test(err.message))
      return { ok: false, error: "אין קרדיט בחשבון Anthropic." };
    if (err instanceof Anthropic.APIError) return { ok: false, error: `שגיאת API: ${err.message}` };
    return { ok: false, error: "התרגום נכשל. נסה שוב." };
  }
}
