import Link from "next/link";
import type { Product } from "@/lib/types";
import { ProductActions } from "@/components/product-actions";
import { ProductArt } from "@/components/product-art";

export function ProductCard({ product, rank }: { product: Product; rank?: number }) {
  const specHighlights = Object.entries(product.specs).slice(0, 2);
  return (
    <article className="product-card">
      <Link
        className="product-card-image-link"
        href={`/products/${product.slug}`}
        aria-label={`View ${product.name}`}
      >
        <ProductArt product={product} />
        <span className="product-rank">
          {rank ? `NO. ${String(rank).padStart(2, "0")}` : "DEMO CATALOG"}
        </span>
        <span className="product-image-arrow" aria-hidden="true">
          ↗
        </span>
      </Link>
      <div className="product-card-body">
        <div className="product-card-overline">
          <span>
            {product.brand} · {product.categoryName}
          </span>
          <span className="product-data-badge">DEMO DATA</span>
        </div>
        <Link href={`/products/${product.slug}`} className="product-card-title">
          <h3>{product.name}</h3>
        </Link>
        <p className="product-model">{product.model}</p>
        <p className="product-card-description">{product.description}</p>
        <div className="product-card-micro-specs">
          {specHighlights.map(([k, v]) => (
            <span key={k}>
              <b>{k}:</b> {v}
            </span>
          ))}
        </div>
        <div className="product-card-bottom">
          <div>
            <strong>{product.priceLabel}</strong>
            <small>sample price · EUR</small>
          </div>
          <span className="reviews-unavailable">
            {product.useCases[0] ?? "Everyday use"}
          </span>
        </div>
        <ProductActions slug={product.slug} />
      </div>
    </article>
  );
}
