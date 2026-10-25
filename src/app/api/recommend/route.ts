import { NextResponse } from "next/server";
import { buildAdvisorResponse } from "@/lib/recommend";
import { checkRateLimit, parseBoundedNumber, requestRateLimitKey, sanitizeText } from "@/lib/security";

export async function POST(request: Request) {
  const clientIp = requestRateLimitKey(request);
  const rate = checkRateLimit(`recommend:${clientIp}`, 60, 60_000);
  if (!rate.allowed) {
    return NextResponse.json({ error: "Too many recommendation requests. Please wait a moment." }, { status: 429 });
  }

  try {
    const input = (await request.json()) as Record<string, unknown>;
    const query = sanitizeText(input.query ?? "", 320);
    const category = sanitizeText(input.category ?? "", 60) || undefined;
    const priority = sanitizeText(input.priority ?? "balanced", 40) || "balanced";
    const budget = parseBoundedNumber(input.budget, 10, 25000);

    if (!query && !category) {
      return NextResponse.json(
        { error: "Describe what you are shopping for or choose a category to build a shortlist." },
        { status: 400 }
      );
    }

    const response = buildAdvisorResponse({
      query,
      category,
      budget,
      priority,
    });

    return NextResponse.json(response, {
      headers: {
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return NextResponse.json({ error: "Enter a product need to get a demo shortlist." }, { status: 400 });
  }
}
