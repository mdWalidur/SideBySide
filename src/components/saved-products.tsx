"use client";

import Link from "next/link";
import { ProductCard } from "@/components/product-card";
import { products } from "@/lib/catalog";
import { useShopStore } from "@/store/use-shop-store";

export function SavedProducts() {
  const savedSlugs = useShopStore((state) => state.wishlist);
  const priceAlerts = useShopStore((state) => state.priceAlerts);
  const removePriceAlert = useShopStore((state) => state.removePriceAlert);

  const saved = products.filter((product) => savedSlugs.includes(product.slug));
  const alertEntries = priceAlerts
    .map((alert) => ({
      alert,
      product: products.find((p) => p.slug === alert.slug),
    }))
    .filter(
      (
        entry
      ): entry is { alert: (typeof priceAlerts)[number]; product: (typeof products)[number] } =>
        Boolean(entry.product)
    );

  return (
    <section className="saved-page">
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <Link href="/">Discover</Link>
        <span>/</span>
        <strong>Saved products & price alerts</strong>
      </nav>

      <div className="section-heading">
        <div>
          <div className="eyebrow">
            <span className="eyebrow-stroke" />
            YOUR PERSONAL SHORTLIST & ALERTS
          </div>
          <h1>
            Keep the good <em>ones close.</em>
          </h1>
        </div>
        <p>
          Saved locally in this browser.
          <br />
          No account needed.
        </p>
      </div>

      {alertEntries.length > 0 && (
        <div className="saved-alerts-panel">
          <span className="eyebrow">ACTIVE PRICE-DROP WATCHLIST</span>
          <div className="saved-alerts-list">
            {alertEntries.map(({ alert, product }) => (
              <div className="saved-alert-row" key={alert.slug}>
                <div>
                  <Link href={`/products/${product.slug}`}>
                    <strong>{product.name}</strong>
                  </Link>
                  <span>
                    Current best: {product.priceLabel} · Target alert:{" "}
                    <b>€{alert.targetPriceEur}</b> (set {alert.createdAt})
                  </span>
                </div>
                <button
                  type="button"
                  className="notice-secondary"
                  onClick={() => removePriceAlert(alert.slug)}
                >
                  Remove alert ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {saved.length ? (
        <div className="product-grid">
          {saved.map((product, index) => (
            <ProductCard key={product.slug} product={product} rank={index + 1} />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <strong>Your shortlist is ready when you are.</strong>
          <span>
            Save a product with the heart icon (♡) or set a target price alert on any product
            page and it will appear here.
          </span>
          <Link href="/#catalog">Explore the lab catalog ↗</Link>
        </div>
      )}
    </section>
  );
}
