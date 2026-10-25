import { NextResponse } from "next/server";
import { getProduct } from "@/lib/catalog";
import { checkRateLimit, sanitizeText } from "@/lib/security";

export async function POST(request: Request) {
  const clientIp = request.headers.get("x-forwarded-for") ?? "local";
  const rate = checkRateLimit(`compare:${clientIp}`, 90, 60_000);
  if (!rate.allowed) {
    return NextResponse.json({ error: "Rate limit exceeded." }, { status: 429 });
  }

  const body = (await request.json().catch(() => null)) as { slugs?: unknown } | null;
  if (
    !Array.isArray(body?.slugs) ||
    body.slugs.length < 2 ||
    body.slugs.length > 5 ||
    !body.slugs.every((slug) => typeof slug === "string")
  ) {
    return NextResponse.json({ error: "Choose between two and five products from one category." }, { status: 400 });
  }

  const uniqueSlugs = [...new Set(body.slugs.map((s) => sanitizeText(s, 80)))];
  if (uniqueSlugs.length < 2) {
    return NextResponse.json({ error: "Select at least two distinct products to compare." }, { status: 400 });
  }

  const selected = uniqueSlugs.map((slug) => getProduct(slug));
  if (selected.some((product) => !product)) {
    return NextResponse.json({ error: "One or more products were not found." }, { status: 404 });
  }

  const validProducts = selected.filter((p): p is NonNullable<typeof p> => Boolean(p));
  if (new Set(validProducts.map((product) => product.category)).size !== 1) {
    return NextResponse.json(
      { error: "Compare products within the same category so the criteria stay relevant." },
      { status: 400 }
    );
  }

  return NextResponse.json({
    products: validProducts,
    dataNotice:
      "All values are fictional demo specifications. No winner or score is imposed — compare the capabilities and tradeoffs for your needs.",
  });
}
