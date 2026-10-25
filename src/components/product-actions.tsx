"use client";

import { useState } from "react";
import { ensureShopHydrated, useShopStore } from "@/store/use-shop-store";
import { products } from "@/lib/catalog";

export function ProductActions({
  slug,
  label = "Add to compare",
}: {
  slug: string;
  label?: string;
}) {
  const saved = useShopStore((state) => state.wishlist.includes(slug));
  const compared = useShopStore((state) => state.comparison.includes(slug));
  const toggleWishlist = useShopStore((state) => state.toggleWishlist);
  const toggleComparison = useShopStore((state) => state.toggleComparison);
  const count = useShopStore((state) => state.comparison.length);
  const [busy, setBusy] = useState(false);

  async function changeCompare() {
    if (busy) return;
    setBusy(true);
    try {
      await ensureShopHydrated();
      const state = useShopStore.getState();
      const isCompared = state.comparison.includes(slug);
      const candidate = products.find((product) => product.slug === slug);
      const firstSelected = products.find((product) => product.slug === state.comparison[0]);
      if (!isCompared && firstSelected && candidate && candidate.category !== firstSelected.category) {
        window.dispatchEvent(
          new CustomEvent("sidebyside:invalid-compare", {
            detail: {
              message: `You are currently comparing ${firstSelected.categoryName.toLowerCase()}s (${firstSelected.name}). Would you like to switch your comparison to ${candidate.name} (${candidate.categoryName.toLowerCase()}) instead?`,
              candidateSlug: slug,
            },
          })
        );
        return;
      }
      if (!isCompared && state.comparison.length >= 3) {
        window.dispatchEvent(
          new CustomEvent("sidebyside:invalid-compare", {
            detail: "A comparison can include up to three products. Remove one to add another.",
          })
        );
        return;
      }
      toggleComparison(slug);
    } finally {
      setBusy(false);
    }
  }

  async function changeSaved() {
    if (busy) return;
    setBusy(true);
    try {
      await ensureShopHydrated();
      toggleWishlist(slug);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="product-actions">
      <button
        type="button"
        className={`icon-action ${saved ? "saved" : ""}`}
        aria-label={saved ? "Remove from saved products" : "Save product"}
        title={saved ? "Saved" : "Save product"}
        onClick={changeSaved}
        disabled={busy}
      >
        {saved ? "♥" : "♡"}
      </button>
      <button
        type="button"
        className={`compare-action ${compared ? "selected" : ""}`}
        onClick={changeCompare}
        disabled={busy || (!compared && count >= 3)}
        aria-label={compared ? "Remove from comparison" : label}
      >
        {busy ? "Adding…" : compared ? "✓ Added" : count >= 3 ? "3 product limit" : label}
      </button>
    </div>
  );
}
