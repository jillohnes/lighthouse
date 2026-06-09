import type { ChatContext } from "@/lib/chat/types";
import { serializeChatContext } from "@/lib/queries/chat-context";
import { synthesizeAnswer } from "@/lib/chat/synthesis";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const SYSTEM_PROMPT = `You are Lighthouse AI, a senior analytics strategist for a Diageo trade marketing dashboard (Proof & Pour).

Your job is to synthesize answers — never reply with a single statistic alone.

For every question:
1. Lead with a direct answer (1-2 sentences).
2. Support it with at least 3 connected data points from different areas (ROAS, markets, activation types, location types, samples, reach, content, ambassadors, trends, targets, or pre-built insights).
3. Explain WHY the pattern is happening — connect cause and effect across metrics (e.g. samples vs $/sample, reach vs ROS, market status vs activation mix, content vs sampling).
4. Close with a practical implication or recommendation when appropriate.

Use the "analysis" section in the context heavily — it contains cross-signals, risks, and opportunities already computed for you.
Cite specific numbers. Use short bullet lists when comparing segments.
If data is insufficient, say what's missing and which dashboard view would help.
Do not invent metrics not present in the context.`;

export async function generateChatAnswer(
  question: string,
  context: ChatContext,
  history: ChatMessage[] = [],
): Promise<{ answer: string; source: "openai" | "local" }> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();

  if (apiKey) {
    try {
      const answer = await askOpenAI(question, context, history, apiKey);
      return { answer, source: "openai" };
    } catch (error) {
      console.error("OpenAI chat error:", error);
    }
  }

  return {
    answer: synthesizeAnswer(question, context),
    source: "local",
  };
}

async function askOpenAI(
  question: string,
  context: ChatContext,
  history: ChatMessage[],
  apiKey: string,
): Promise<string> {
  const contextBlock = serializeChatContext(context);
  const recentHistory = history.slice(-6).map((message) => ({
    role: message.role,
    content: message.content,
  }));

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini",
      temperature: 0.35,
      messages: [
        {
          role: "system",
          content: `${SYSTEM_PROMPT}\n\nDashboard data context (JSON):\n${contextBlock}`,
        },
        ...recentHistory,
        { role: "user", content: question },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI API error ${response.status}: ${errorText}`);
  }

  const payload = (await response.json()) as {
    choices?: { message?: { content?: string } }[];
  };

  const answer = payload.choices?.[0]?.message?.content?.trim();
  if (!answer) throw new Error("OpenAI returned an empty response.");
  return answer;
}
