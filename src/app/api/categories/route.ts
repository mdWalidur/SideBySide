import { NextResponse } from "next/server";
import { categories } from "@/lib/catalog";

export async function GET() {
  return NextResponse.json(
    { categories, total: categories.length, demo: true },
    {
      headers: {
        "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
        "X-Content-Type-Options": "nosniff",
      },
    }
  );
}
