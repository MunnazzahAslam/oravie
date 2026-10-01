import { anthropic } from "@ai-sdk/anthropic";
import {
  convertToModelMessages,
  createUIMessageStreamResponse,
  isStepCount,
  smoothStream,
  streamText,
  toUIMessageStream,
  type LanguageModel,
  type UIMessage,
} from "ai";
import { buildSystemPrompt } from "@/lib/noor/prompt";
import { NOOR_LIMITS } from "@/lib/noor/limits";
import { noorTools } from "@/lib/noor/tools";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export const maxDuration = 30;

const DEFAULT_MODEL = "claude-haiku-4-5";

async function pickModel(): Promise<LanguageModel | null> {
  // Offline test double for local UI work only; never used in production.
  if (process.env.NOOR_MOCK === "1" && process.env.NODE_ENV !== "production") {
    const { mockNoorModel } = await import("@/lib/noor/mock-model");
    return mockNoorModel();
  }
  if (!process.env.ANTHROPIC_API_KEY) return null;
  return anthropic(process.env.AI_MODEL || DEFAULT_MODEL);
}

const textOf = (m: UIMessage) =>
  m.parts.map((p) => (p.type === "text" ? p.text : "")).join("");

export async function POST(req: Request) {
  let messages: UIMessage[];
  try {
    ({ messages } = await req.json());
    if (!Array.isArray(messages) || messages.length === 0) throw new Error();
  } catch {
    return Response.json({ error: "bad-request" }, { status: 400 });
  }

  const last = messages[messages.length - 1];
  if (last.role !== "user" || textOf(last).length > NOOR_LIMITS.maxInputChars) {
    return Response.json({ error: "message-too-long" }, { status: 413 });
  }

  const limit = rateLimit(clientIp(req), NOOR_LIMITS.rateLimit, NOOR_LIMITS.rateWindowMs);
  if (!limit.allowed) {
    return Response.json(
      { error: "rate-limited" },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } },
    );
  }

  const model = await pickModel();
  if (!model) return Response.json({ error: "noor-offline" }, { status: 503 });

  // Keep cost bounded: only the most recent turns go to the model.
  const recent = messages.slice(-NOOR_LIMITS.maxHistory);
  while (recent.length && recent[0].role !== "user") recent.shift();

  const result = streamText({
    model,
    system: buildSystemPrompt(),
    messages: await convertToModelMessages(recent),
    tools: noorTools,
    // A turn can be: look up slots, book, then reply. Cap the loop.
    stopWhen: isStepCount(NOOR_LIMITS.maxSteps),
    maxOutputTokens: NOOR_LIMITS.maxOutputTokens,
    experimental_transform: smoothStream({ delayInMs: 18 }),
  });

  return createUIMessageStreamResponse({
    stream: toUIMessageStream({
      stream: result.stream,
      onError: (error) => {
        console.error("Noor stream error", error);
        return "noor-error";
      },
    }),
  });
}
