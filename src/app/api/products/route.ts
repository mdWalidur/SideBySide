import { NextResponse } from "next/server";
import { products } from "@/lib/catalog";
import { searchProducts, type CatalogFilterOptions } from "@/lib/recommend";
import { checkRateLimit, parseBoundedNumber, requestRateLimitKey, sanitizeText } from "@/lib/security";

export async function GET(request: Request) {
  const clientIp = requestRateLimitKey(request);
  const rate = checkRateLimit(`products:${clientIp}`, 120, 60_000);
  if (!rate.allowed) {
    return NextResponse.json({ error: "Rate limit exceeded. Try again shortly." }, { status: 429 });
  }

  const { searchParams } = new URL(request.url);
  const query = sanitizeText(searchParams.get("q") ?? "", 200);
  const category = sanitizeText(searchParams.get("category") ?? "", 60) || undefined;
  const brand = sanitizeText(searchParams.get("brand") ?? "", 60) || undefined;
  const maxPrice = parseBoundedNumber(searchParams.get("maxPrice"), 1, 25000);
  const minRating = parseBoundedNumber(searchParams.get("minRating"), 0, 100);
  const sortRaw = sanitizeText(searchParams.get("sortBy") ?? "overall", 30);
  const validSorts = new Set(["overall", "value", "price-asc", "price-desc", "popularity"]);
  const sortBy = (validSorts.has(sortRaw) ? sortRaw : "overall") as CatalogFilterOptions["sortBy"];

  const found = searchProducts(query, category, maxPrice, {
    brand,
    minRating,
    sortBy,
  });

  return NextResponse.json(
    {
      products: found,
      total: found.length,
      demo: true,
      catalogCount: products.length,
    },
    {
      headers: {
        "Cache-Control": "public, max-age=30, stale-while-revalidate=120",
        "X-Content-Type-Options": "nosniff",
      },
    }
  );
}
