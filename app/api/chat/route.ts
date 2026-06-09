import { NextRequest, NextResponse } from "next/server";
import { generateChatAnswer, type ChatMessage } from "@/lib/chat/assistant";
import { parseFiltersFromBody } from "@/lib/api-filters";
import { buildChatContext } from "@/lib/queries/chat-context";
import { getDashboardData } from "@/lib/queries/dashboard";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const message = String(body.message ?? "").trim();

    if (!message) {
      return NextResponse.json({ error: "Message is required." }, { status: 400 });
    }

    const filters = parseFiltersFromBody(body.filters ?? {});
    const history = Array.isArray(body.history)
      ? (body.history as ChatMessage[]).filter(
          (entry) =>
            (entry.role === "user" || entry.role === "assistant") &&
            typeof entry.content === "string",
        )
      : [];

    const data = await getDashboardData(filters);
    if (!data) {
      return NextResponse.json({
        answer:
          "I could not find dashboard data for the current filters. Try widening your date range or clearing market/brand filters.",
        source: "local",
      });
    }

    const context = buildChatContext(data, filters);
    const { answer, source } = await generateChatAnswer(message, context, history);

    return NextResponse.json({ answer, source });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: "Failed to generate a response. Please try again." },
      { status: 500 },
    );
  }
}
