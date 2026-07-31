import Anthropic from "@anthropic-ai/sdk";
import { calcAge } from "@/lib/format";

let client: Anthropic | null = null;
function getClient(): Anthropic {
  if (!client) client = new Anthropic();
  return client;
}

export async function generatePlayerAiSummaryText(player: any, clubName: string | null): Promise<string> {
  const displayName = player.fullNameEnglish || `${player.firstName} ${player.lastName}`;
  const age = calcAge(player.dateOfBirth);

  const facts = [
    `Name: ${displayName}${player.fullNameHebrew ? ` (${player.fullNameHebrew})` : ""}`,
    `Date of birth: ${player.dateOfBirth}${age ? ` (age ${age})` : ""}`,
    player.nationality ? `Nationality: ${player.nationality}` : null,
    player.mainPosition ? `Position: ${player.mainPosition}` : null,
    clubName ? `Current club: ${clubName}` : "Current club: free agent",
    player.currentLeague ? `League: ${player.currentLeague}` : null,
    player.currentCountry ? `Country: ${player.currentCountry}` : null,
    player.height ? `Height: ${player.height}cm` : null,
  ]
    .filter(Boolean)
    .join("\n");

  const prompt = `You are a professional football scout writing a section of a player profile report that an agency sends to clubs.

Player to research:
${facts}

Search the web for information specifically about this player (try sources like Transfermarkt, Sofascore, official club sites, and recent news). Before using any information, confirm you have the right person by cross-checking name, club, and age/position — footballers often share names.

Write a 5 to 10 sentence professional summary suitable for sending to clubs. Cover career/club history, playing style or strengths if reported, and any notable stats or achievements you can verify. If you cannot find reliable information about this specific player online, write a brief, honest summary based only on the facts listed above — do not invent statistics, achievements, or career details.

Output only the summary text itself, with no heading or preamble.`;

  try {
    const stream = getClient().messages.stream({
      model: "claude-opus-4-8",
      max_tokens: 4096,
      thinking: { type: "adaptive" },
      tools: [{ type: "web_search_20260209", name: "web_search", max_uses: 5 }],
      messages: [{ role: "user", content: prompt }],
    });

    const response = await stream.finalMessage();

    if (response.stop_reason === "refusal") {
      throw new Error("Summary generation was declined by the model.");
    }

    const text = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("\n\n")
      .trim();

    if (!text) throw new Error("No summary text was returned.");
    return text;
  } catch (err) {
    if (err instanceof Anthropic.AuthenticationError) {
      throw new Error("Invalid Anthropic API key.");
    }
    if (err instanceof Anthropic.RateLimitError) {
      throw new Error("Rate limited by Anthropic — try again in a minute.");
    }
    if (err instanceof Anthropic.APIError && /credit balance/i.test(err.message)) {
      throw new Error("The Anthropic account has no credit balance. Add credits at console.anthropic.com under Plans & Billing.");
    }
    if (err instanceof Anthropic.APIError) {
      throw new Error(`Anthropic API error: ${err.message}`);
    }
    throw err;
  }
}
