import type { CSSProperties } from "react";
import type { Product } from "@/lib/types";

const categoryGlyphs: Record<string, string> = {
  phones: "▯",
  computers: "▱",
  audio: "◖",
  home: "⌂",
  cleaning: "⌁",
  beauty: "◒",
  wearables: "◉",
  tablets: "▤",
  cameras: "◎",
  gaming: "⌘",
  televisions: "▣",
  networking: "⌁",
  software: "⌘",
  "ai-tools": "✳",
};

export function ProductArt({ product, large = false }: { product: Product; large?: boolean }) {
  const glyph = categoryGlyphs[product.category] ?? "⌂";
  return (
    <div
      className={`product-art ${large ? "product-art-large" : ""} art-${product.category}`}
      style={{ "--art-color": product.color } as CSSProperties}
      aria-label={`${product.categoryName} concept illustration for ${product.name}`}
      role="img"
    >
      <span className="art-object" aria-hidden="true">
        {glyph}
      </span>
      <span className="art-number" aria-hidden="true">
        S/S · DEMO
      </span>
    </div>
  );
}
