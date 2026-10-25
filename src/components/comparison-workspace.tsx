"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type * as React from "react";
import { ProductArt } from "@/components/product-art";
import { ProductActions } from "@/components/product-actions";
import { ProductPurchaseButton } from "@/components/product-purchase-button";
import { featuredComparisons, products } from "@/lib/catalog";
import type { Product } from "@/lib/types";
import { useShopStore } from "@/store/use-shop-store";

function parseUrlSlugs(search: string): string[] {
  const params = new URLSearchParams(search);
  const raw = params.get("slugs");
  if (!raw) return [];
  const valid = raw
    .split(",")
    .map((s) => s.trim())
    .filter((s) => products.some((p) => p.slug === s));
  if (!valid.length) return [];
  const firstCat = products.find((p) => p.slug === valid[0])?.category;
  return valid
    .filter((s) => products.find((p) => p.slug === s)?.category === firstCat)
    .slice(0, 5);
}

export function ComparisonWorkspace() {
  const storeSlugs = useShopStore((state) => state.comparison);
  const setComparison = useShopStore((state) => state.setComparison);
  const remove = useShopStore((state) => state.removeComparison);
  const clear = useShopStore((state) => state.clearComparison);

  const [urlOverrides, setUrlOverrides] = useState<string[] | null>(null);
  const [differencesOnly, setDifferencesOnly] = useState(false);
  const [selectedNeed, setSelectedNeed] = useState<string>("all");
  const [validationMessage, setValidationMessage] = useState("");
  const [copiedUrl, setCopiedUrl] = useState(false);

  // Sync URL ?slugs=a,b on mount immediately
  useEffect(() => {
    if (typeof window === "undefined") return;
    const fromUrl = parseUrlSlugs(window.location.search);
    if (fromUrl.length > 0) {
      setUrlOverrides(fromUrl);
      setComparison(fromUrl);
    }
  }, [setComparison]);

  const activeSlugs = storeSlugs.length > 0 ? storeSlugs : (urlOverrides ?? []);

  const selected = useMemo(
    () =>
      activeSlugs
        .map((slug) => products.find((product) => product.slug === slug))
        .filter((item): item is Product => Boolean(item)),
    [activeSlugs]
  );

  const category = selected[0]?.category;
  const alternatives = useMemo(
    () =>
      products.filter(
        (product) => product.category === category && !activeSlugs.includes(product.slug)
      ),
    [category, activeSlugs]
  );

  // Collect all distinct user needs / use-cases across the compared products
  const availableNeeds = useMemo(
    () => [...new Set(selected.flatMap((p) => p.useCases))],
    [selected]
  );

  // Keep URL query string updated when selection changes
  useEffect(() => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    if (selected.length > 0) {
      url.searchParams.set("slugs", selected.map((s) => s.slug).join(","));
      window.history.replaceState({}, "", url.toString());
    }
  }, [selected]);

  useEffect(() => {
    if (activeSlugs.length < 2) {
      setValidationMessage("");
      return;
    }
    fetch("/api/compare", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slugs: activeSlugs }),
    })
      .then(async (response) => {
        const payload = await response.json();
        setValidationMessage(response.ok ? payload.dataNotice : payload.error);
      })
      .catch(() => setValidationMessage("Showing the local fictional demo comparison."));
  }, [activeSlugs]);

  const specKeys = useMemo(
    () => [...new Set(selected.flatMap((product) => Object.keys(product.specs)))],
    [selected]
  );

  type MatrixRow = {
    label: string;
    values: string[];
  };

  const rows: MatrixRow[] = useMemo(() => {
    if (!selected.length) return [];

    const specRows: MatrixRow[] = specKeys.map((label) => ({
      label,
      values: selected.map((product) => product.specs[label] ?? "—"),
    }));

    return [
      {
        label: "Price",
        values: selected.map((product) => product.priceLabel),
      },
      {
        label: "Best suited for (User needs)",
        values: selected.map((product) => product.useCases.join(" · ")),
      },
      {
        label: "Who it fits best",
        values: selected.map((product) => product.verdict.bestFor.join(" · ")),
      },
      {
        label: "Who should skip it",
        values: selected.map((product) => product.verdict.avoidIf.join(" · ")),
      },
      ...specRows,
      {
        label: "Key capabilities & strengths",
        values: selected.map((product) => product.pros.join(" · ")),
      },
      {
        label: "Practical tradeoffs",
        values: selected.map((product) => product.cons.join(" · ")),
      },
    ];
  }, [selected, specKeys]);

  const visibleRows = rows.filter((row) => !differencesOnly || new Set(row.values).size > 1);

  async function copyShareLink() {
    if (typeof window === "undefined") return;
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopiedUrl(true);
      window.setTimeout(() => setCopiedUrl(false), 2500);
    } catch {
      setCopiedUrl(false);
    }
  }

  function handleClearAll() {
    setUrlOverrides(null);
    setSelectedNeed("all");
    clear();
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.delete("slugs");
      window.history.replaceState({}, "", url.toString());
    }
  }

  function handleRemoveOne(slugToRemove: string) {
    setUrlOverrides((prev) => (prev ? prev.filter((s) => s !== slugToRemove) : null));
    remove(slugToRemove);
  }

  return (
    <section className="compare-page">
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <Link href="/">Discover</Link>
        <span>/</span>
        <strong>Product comparison</strong>
      </nav>

      <div className="compare-page-heading">
        <div>
          <div className="eyebrow">
            <span className="eyebrow-stroke" />
            SIDE-BY-SIDE CAPABILITIES & USER NEEDS
          </div>
          <h1>
            Compare the <em>details.</em>
          </h1>
          <p>
            See how features, capabilities, and practical tradeoffs align with your everyday needs.
            No arbitrary scores — the choice stays yours.
          </p>
        </div>
        <div className="compare-heading-actions">
          {selected.length >= 2 && (
            <button
              type="button"
              className="share-comparison-btn"
              onClick={() => void copyShareLink()}
            >
              {copiedUrl ? "✓ Comparison link copied" : "Share comparison link ↗"}
            </button>
          )}
          <button
            type="button"
            className="clear-comparison-page"
            disabled={!selected.length}
            onClick={handleClearAll}
          >
            Clear comparison <span>×</span>
          </button>
        </div>
      </div>

      {selected.length === 0 ? (
        <>
          <div className="compare-empty">
            <div className="compare-empty-icon">↔</div>
            <div>
              <strong>Start with a preset comparison or pick products from the catalog.</strong>
              <span>
                Compare 2 to 5 products in the same category across features, capabilities, and real-world user needs.
              </span>
            </div>
            <Link href="/#catalog">
              Browse catalog <span>↗</span>
            </Link>
          </div>

          <div className="preset-comparisons-block">
            <div className="eyebrow">
              <span className="eyebrow-stroke" />
              POPULAR COMPARISONS
            </div>
            <h2>
              Compare capabilities <em>side-by-side.</em>
            </h2>
            <div className="featured-comparison-grid">
              {featuredComparisons.map((preset) => (
                <article className="featured-comparison-card" key={preset.id}>
                  <span>{preset.categoryLabel}</span>
                  <h3>{preset.title}</h3>
                  <p>{preset.subtitle}</p>
                  <button
                    type="button"
                    onClick={() => {
                      setUrlOverrides(preset.slugs);
                      setComparison(preset.slugs);
                    }}
                  >
                    Compare {preset.slugs.length} products <span>↗</span>
                  </button>
                </article>
              ))}
            </div>
          </div>
        </>
      ) : selected.length === 1 ? (
        <div className="compare-one-product">
          <div className="compare-one-current">
            <span className="eyebrow">YOUR FIRST PICK</span>
            <div className="compare-one-product-card">
              <ProductArt product={selected[0]} />
              <div>
                <Link href={`/products/${selected[0].slug}`}>
                  <strong>{selected[0].name}</strong>
                </Link>
                <span>
                  {selected[0].brand} · {selected[0].priceLabel} · {selected[0].model}
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleRemoveOne(selected[0].slug)}
                aria-label={`Remove ${selected[0].name}`}
              >
                ×
              </button>
            </div>
          </div>
          <div className="compare-add-more">
            <span className="eyebrow">
              ADD A SECOND OPTION IN {selected[0].categoryName.toUpperCase()}
            </span>
            <h2>
              What else is <em>in the running?</em>
            </h2>
            {alternatives.map((product) => (
              <div className="compare-suggestion" key={product.slug}>
                <ProductArt product={product} />
                <span>
                  <strong>{product.name}</strong>
                  <small>
                    {product.brand} · {product.priceLabel} · {product.model}
                  </small>
                </span>
                <ProductActions slug={product.slug} label="Add" />
              </div>
            ))}
            {!alternatives.length && <p>No other products are available in this category.</p>}
          </div>
        </div>
      ) : (
        <>
          {/* User Need / Scenario Filter Bar (No scores, focuses purely on user needs & capabilities) */}
          {availableNeeds.length > 0 && (
            <div className="weights-tuning-panel">
              <div className="weights-tuning-header">
                <div>
                  <span className="eyebrow">MATCH BY USER NEED</span>
                  <strong>Highlight which product fits your primary use case</strong>
                </div>
                {selectedNeed !== "all" && (
                  <button
                    type="button"
                    className="reset-weights-btn"
                    onClick={() => setSelectedNeed("all")}
                  >
                    Show all needs
                  </button>
                )}
              </div>
              <div className="parsed-intent-chips" style={{ marginTop: "6px" }}>
                <button
                  type="button"
                  className={`need-pill-btn ${selectedNeed === "all" ? "active" : ""}`}
                  onClick={() => setSelectedNeed("all")}
                >
                  All use cases
                </button>
                {availableNeeds.map((need) => (
                  <button
                    type="button"
                    key={need}
                    className={`need-pill-btn ${selectedNeed === need ? "active" : ""}`}
                    onClick={() => setSelectedNeed(need)}
                  >
                    {need}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="comparison-shell">
            <div className="comparison-toolbar">
              <span>
                {selected.length} products · {selected[0]?.categoryName}
              </span>
              <div>
                <label className="differences-label">
                  <input
                    type="checkbox"
                    checked={differencesOnly}
                    onChange={(event) => setDifferencesOnly(event.target.checked)}
                  />
                  <span className="switch" />
                  Differences only
                </label>
                <span className="comparison-toolbar-note">Swipe to see all products</span>
              </div>
            </div>

            <div
              className="comparison-overflow"
              role="region"
              aria-label="Product comparison table; horizontally scroll to view all products"
              tabIndex={0}
            >
              <div
                className="comparison-grid"
                style={{ "--product-count": selected.length } as React.CSSProperties}
              >
                <div className="compare-cell compare-label compare-product-label">
                  <span>PRODUCT</span>
                  <strong>At a glance</strong>
                </div>

                {selected.map((product) => {
                  const matchesNeed =
                    selectedNeed !== "all" && product.useCases.includes(selectedNeed);
                  return (
                    <div
                      className={`compare-cell compare-product ${
                        matchesNeed ? "compare-winner-col" : ""
                      }`}
                      key={product.slug}
                    >
                      <button
                        type="button"
                        onClick={() => handleRemoveOne(product.slug)}
                        aria-label={`Remove ${product.name}`}
                      >
                        ×
                      </button>
                      {matchesNeed && (
                        <span className="winner-crown-badge">✓ BUILT FOR THIS NEED</span>
                      )}
                      <ProductArt product={product} />
                      <small>{product.brand}</small>
                      <Link href={`/products/${product.slug}`}>
                        <strong>{product.name}</strong>
                      </Link>
                      <b>{product.priceLabel}</b>
                      <div style={{ width: "100%", marginTop: "4px" }}>
                        <ProductPurchaseButton slug={product.slug} label="Buy / Track" />
                      </div>
                    </div>
                  );
                })}

                {visibleRows.flatMap((row) => [
                  <div className="compare-cell compare-label" key={`${row.label}-label`}>
                    {row.label}
                  </div>,
                  ...selected.map((product, index) => {
                    const hasDiff = new Set(row.values).size > 1;
                    return (
                      <div
                        className={`compare-cell ${hasDiff ? "compare-difference" : ""}`}
                        key={`${row.label}-${product.slug}`}
                      >
                        <span>{row.values[index]}</span>
                      </div>
                    );
                  }),
                ])}
              </div>
            </div>

            <div className="comparison-disclosure">
              {validationMessage ||
                "Specifications and sample prices are fictional demo data. No scores or winner claims are imposed."}
            </div>
          </div>
        </>
      )}

      {selected.length > 1 && alternatives.length > 0 && (
        <div className="compare-add-another">
          <span>Want another {selected[0]?.categoryName.toLowerCase()} in the mix?</span>
          {alternatives.map((product) => (
            <ProductActions
              key={product.slug}
              slug={product.slug}
              label={`+ Add ${product.name} (${product.priceLabel})`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
