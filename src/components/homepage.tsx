"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ProductArt } from "@/components/product-art";
import { ProductActions } from "@/components/product-actions";
import { ProductCard } from "@/components/product-card";
import { ProductPurchaseButton } from "@/components/product-purchase-button";
import { categories, featuredComparisons, products } from "@/lib/catalog";
import { searchProducts, type CatalogFilterOptions } from "@/lib/recommend";
import type { AdvisorPriority, AdvisorResponse } from "@/lib/types";
import { useShopStore } from "@/store/use-shop-store";

const ideas = [
  "I need a gaming laptop under €1,500",
  "Recommend a cordless vacuum for a small apartment",
  "Find a phone with a great camera and battery",
  "Quiet air purifier for a bedroom under €260",
  "Handheld OLED gaming console with repairable SSD",
];

const priorityOptions: Array<{ value: AdvisorPriority; label: string }> = [
  { value: "balanced", label: "Balanced everyday use" },
  { value: "value", label: "Budget & value" },
  { value: "performance", label: "Heavy workloads & speed" },
  { value: "longevity", label: "Long-term support & repair" },
  { value: "compact", label: "Compact & portable" },
];

export function Homepage() {
  const router = useRouter();
  const setComparison = useShopStore((state) => state.setComparison);

  // Advisor State
  const [query, setQuery] = useState("");
  const [advisorCategory, setAdvisorCategory] = useState("all");
  const [advisorBudget, setAdvisorBudget] = useState<string>("");
  const [advisorPriority, setAdvisorPriority] = useState<AdvisorPriority>("balanced");
  const [advisorResponse, setAdvisorResponse] = useState<AdvisorResponse | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  // Catalog Explorer State
  const [catalogSearch, setCatalogSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [maxPrice, setMaxPrice] = useState<number | undefined>(undefined);
  const [sortBy, setSortBy] = useState<NonNullable<CatalogFilterOptions["sortBy"]>>("popularity");

  const filteredCatalog = useMemo(
    () =>
      searchProducts(catalogSearch, selectedCategory === "all" ? undefined : selectedCategory, maxPrice, {
        sortBy,
      }),
    [catalogSearch, selectedCategory, maxPrice, sortBy]
  );

  async function runAdvisor(
    overrideQuery?: string,
    overrideCat?: string,
    overrideBudget?: string,
    overridePrio?: AdvisorPriority
  ) {
    const prompt = (overrideQuery ?? query).trim();
    const cat = overrideCat ?? advisorCategory;
    const budStr = overrideBudget ?? advisorBudget;
    const prio = overridePrio ?? advisorPriority;

    if (!prompt && cat === "all") {
      setMessage("Describe what you’re shopping for or select a category to build a personalized shortlist.");
      return;
    }

    if (overrideQuery !== undefined) setQuery(prompt);
    setBusy(true);
    setMessage("");

    try {
      const numericBudget = budStr ? Number(budStr) : undefined;
      const response = await fetch("/api/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: prompt,
          category: cat === "all" ? undefined : cat,
          budget: numericBudget,
          priority: prio,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Couldn’t build a shortlist.");
      setAdvisorResponse(data as AdvisorResponse);
      window.setTimeout(
        () => document.querySelector("#recommendations")?.scrollIntoView({ behavior: "smooth", block: "start" }),
        80
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Couldn’t build a shortlist.");
    } finally {
      setBusy(false);
    }
  }

  function launchComparisonPreset(slugs: string[]) {
    setComparison(slugs);
    router.push(`/compare?slugs=${slugs.join(",")}`);
  }

  const results = advisorResponse?.results ?? null;
  const intent = advisorResponse?.intent;

  return (
    <>
      {/* 1. AI Product Advisor Hero */}
      <section className={`landing-hero ${results ? "landing-has-results" : ""}`} id="advisor">
        <div className="landing-content">
          <div className="ai-kicker">
            <span className="ai-spark">✳</span>
            <span>YOUR AI PRODUCT ADVISOR</span>
            <span className="demo-pill">{products.length} CATALOG MODELS</span>
          </div>
          <h1>
            Tell us what you need.
            <br />
            <em>We’ll find what fits.</em>
          </h1>
          <p className="landing-subtitle">
            Describe the product you have in mind. Get a shortlist matched to your everyday needs,
            capabilities, and budget — with no arbitrary scores or paid rankings.
          </p>

          <form
            className="prompt-box"
            onSubmit={(event) => {
              event.preventDefault();
              void runAdvisor();
            }}
          >
            <label className="sr-only" htmlFor="product-prompt">
              Describe the product you need
            </label>
            <textarea
              id="product-prompt"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  void runAdvisor();
                }
              }}
              placeholder="e.g., I need a lightweight laptop for university under €1,200 with all-day battery…"
              rows={2}
            />

            {/* Structured Intent Refinement Bar */}
            <div className="advisor-structured-bar">
              <label>
                <span>Category</span>
                <select
                  value={advisorCategory}
                  onChange={(e) => {
                    const nextCat = e.target.value;
                    setAdvisorCategory(nextCat);
                    if (results) void runAdvisor(query, nextCat, advisorBudget, advisorPriority);
                  }}
                >
                  <option value="all">Auto-detect category</option>
                  {categories.map((c) => (
                    <option key={c.slug} value={c.slug}>
                      {c.name} ({c.count})
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <span>Max Budget (€)</span>
                <input
                  type="number"
                  min={20}
                  max={5000}
                  step={10}
                  placeholder="Auto / Any"
                  value={advisorBudget}
                  onChange={(e) => setAdvisorBudget(e.target.value)}
                />
              </label>

              <label>
                <span>Primary Need</span>
                <select
                  value={advisorPriority}
                  onChange={(e) => {
                    const nextPrio = e.target.value as AdvisorPriority;
                    setAdvisorPriority(nextPrio);
                    if (results) void runAdvisor(query, advisorCategory, advisorBudget, nextPrio);
                  }}
                >
                  {priorityOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="prompt-controls">
              <span className="prompt-privacy">
                <span>✳</span> Personalized to what matters to you
              </span>
              <button type="submit" disabled={busy}>
                {busy ? "Finding matches…" : "Find my product"}
                <span>↗</span>
              </button>
            </div>
          </form>

          <div className="idea-list">
            <span>TRY AN EXAMPLE</span>
            {ideas.map((idea) => (
              <button
                type="button"
                key={idea}
                onClick={() => {
                  setQuery(idea);
                  void runAdvisor(idea);
                }}
              >
                {idea}
                <span>↗</span>
              </button>
            ))}
          </div>
          <div className="landing-trust">
            <span>✳</span> Clear reasons. Honest tradeoffs. No paid rankings or arbitrary scores.
          </div>
        </div>
        <div className="landing-scribble" aria-hidden="true">
          <span className="scribble-circle" />
          <span className="scribble-star">✳</span>
          <span className="scribble-caption">
            A BETTER WAY
            <br />
            TO FIND YOUR FIT
          </span>
        </div>
      </section>

      {/* 2. Personalized AI Advisor Shortlist Results */}
      {results && (
        <section id="recommendations" className="recommendation-results" aria-live="polite">
          <div className="results-heading">
            <div>
              <div className="eyebrow">
                <span className="eyebrow-stroke" />
                YOUR PERSONALIZED SHORTLIST
              </div>
              <h2>
                Here’s where I’d <em>start.</em>
              </h2>
              <p className="results-query">
                {query ? `“${query}”` : `Category shortlist: ${intent?.detectedCategoryName ?? "All"}`}
              </p>

              {/* Parsed Intent Telemetry Chips */}
              {intent && (
                <div className="parsed-intent-chips">
                  {intent.detectedCategoryName && (
                    <span className="intent-chip">
                      Category: <b>{intent.detectedCategoryName}</b>
                    </span>
                  )}
                  {intent.detectedBudget !== undefined && (
                    <span className="intent-chip">
                      Target Budget: <b>≤ €{intent.detectedBudget}</b>
                    </span>
                  )}
                  {intent.detectedPriorities.length > 0 && (
                    <span className="intent-chip">
                      Focus: <b>{intent.detectedPriorities.join(", ")}</b>
                    </span>
                  )}
                  {intent.detectedUseCases.length > 0 && (
                    <span className="intent-chip">
                      Your needs: <b>{intent.detectedUseCases.slice(0, 4).join(" · ")}</b>
                    </span>
                  )}
                </div>
              )}
            </div>

            <div className="results-heading-actions">
              {results.length >= 2 && (
                <button
                  type="button"
                  className="compare-all-shortlist-btn"
                  onClick={() =>
                    launchComparisonPreset(results.slice(0, 4).map((r) => r.product.slug))
                  }
                >
                  Compare all {results.length} side-by-side <span>↔</span>
                </button>
              )}
              <button
                type="button"
                className="new-search"
                onClick={() => {
                  setAdvisorResponse(null);
                  setQuery("");
                  document.querySelector("#advisor")?.scrollIntoView({ behavior: "smooth" });
                }}
              >
                New search <span>↗</span>
              </button>
            </div>
          </div>

          {/* Head-to-Head Capability Tradeoff Banner */}
          {advisorResponse?.headToHeadSummary && results.length >= 2 && (
            <div className="head-to-head-banner">
              <div>
                <span className="eyebrow">KEY CAPABILITY TRADEOFF</span>
                <p>
                  <strong>{results[0].product.name}</strong> ({results[0].product.priceLabel}) stands
                  out for <em>{advisorResponse.headToHeadSummary.keyAdvantageTop.toLowerCase()}</em>,
                  while <strong>{results[1].product.name}</strong> ({results[1].product.priceLabel})
                  offers{" "}
                  <em>{advisorResponse.headToHeadSummary.keyAdvantageRunnerUp.toLowerCase()}</em> (a
                  €{advisorResponse.headToHeadSummary.priceDeltaEur} price difference).
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  launchComparisonPreset([results[0].product.slug, results[1].product.slug])
                }
              >
                Compare top 2 ↗
              </button>
            </div>
          )}

          {results.length ? (
            <div className="recommendation-list">
              {results.map((item, index) => (
                <article className="shortlist-card" key={item.product.slug}>
                  <div className="shortlist-rank">
                    <span>{index === 0 ? "CLOSEST FIT" : `OPTION 0${index + 1}`}</span>
                    <strong style={{ fontSize: "14px", textAlign: "center", lineHeight: 1.25 }}>
                      {item.roleLabel}
                    </strong>
                    <small>{item.product.useCases[0] ?? "everyday fit"}</small>
                  </div>
                  <Link href={`/products/${item.product.slug}`} className="shortlist-art-link">
                    <ProductArt product={item.product} />
                  </Link>
                  <div className="shortlist-details">
                    <div className="product-card-overline">
                      <span>
                        {item.product.brand} · {item.product.categoryName.toUpperCase()}
                      </span>
                      <span className="product-data-badge">FICTIONAL DEMO</span>
                    </div>
                    <Link href={`/products/${item.product.slug}`}>
                      <h3>{item.product.name}</h3>
                    </Link>
                    <p className="shortlist-model">{item.product.model}</p>
                    <p className="shortlist-summary">{item.product.description}</p>
                    <div className="match-reasons">
                      <strong>How it fits your needs</strong>
                      <ul>
                        {item.reasons.map((reason) => (
                          <li key={reason}>{reason}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="fit-tradeoffs">
                      <span>
                        <b>Strengths</b>
                        {item.strengths.join(" · ")}
                      </span>
                      <span>
                        <b>Tradeoffs</b>
                        {item.tradeoffs.join(" · ")}
                      </span>
                    </div>
                  </div>
                  <div className="shortlist-actions">
                    <span className="shortlist-price">
                      {item.product.priceLabel}
                      <small>sample price · EUR</small>
                    </span>
                    <ProductActions slug={item.product.slug} label="Compare" />
                    <ProductPurchaseButton slug={item.product.slug} label="Buy options" />
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="no-matches">
              <span>✳</span>
              <div>
                <strong>No exact matches for that combination.</strong>
                <p>
                  Try broadening your budget or switching category to explore our 27 demo products.
                </p>
              </div>
            </div>
          )}

          {advisorResponse?.followUpSuggestions && advisorResponse.followUpSuggestions.length > 0 && (
            <div className="idea-list" style={{ justifyContent: "flex-start", marginTop: "16px" }}>
              <span>REFINE YOUR NEED</span>
              {advisorResponse.followUpSuggestions.map((sug) => (
                <button
                  type="button"
                  key={sug}
                  onClick={() => {
                    setQuery(sug);
                    void runAdvisor(sug);
                  }}
                >
                  {sug} <span>↗</span>
                </button>
              ))}
            </div>
          )}

          <div className="recommendation-disclosure">
            Recommendations are matched by comparing your stated needs, use cases, and budget against
            product capabilities and tradeoffs. No scores or paid placements are used.
          </div>
        </section>
      )}

      {/* 3. Category Taxonomy Grid (14 Active Verticals) */}
      <section className="category-section" id="categories">
        <div className="section-heading">
          <div>
            <div className="eyebrow">
              <span className="eyebrow-stroke" />
              01 — BROWSE BY CATEGORY
            </div>
            <h2>
              Explore every <em>category.</em>
            </h2>
          </div>
          <p>
            14 product categories structured around real-world capabilities, specifications, and
            honest tradeoffs.
          </p>
        </div>
        <div className="category-grid">
          {categories.map((category) => (
            <Link
              key={category.slug}
              href={`/categories/${category.slug}`}
              className={`category-tile category-${category.slug}`}
            >
              <div className="category-illustration" aria-hidden="true">
                {category.icon}
              </div>
              <strong className="category-name">{category.name}</strong>
              <span className="category-description">{category.description}</span>
              <div className="category-meta">
                <span>{category.count} MODELS</span>
                <b>↗</b>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 4. Curated Head-to-Head Showdowns */}
      <section className="featured-comparisons">
        <div className="section-heading">
          <div>
            <div className="eyebrow">
              <span className="eyebrow-stroke" />
              02 — SIDE-BY-SIDE COMPARISONS
            </div>
            <h2>
              Popular <em>comparisons.</em>
            </h2>
          </div>
          <p>
            See how popular options trade off size, battery life, capabilities, and price side-by-side.
          </p>
        </div>
        <div className="featured-comparison-grid">
          {featuredComparisons.map((item) => {
            const pairProducts = item.slugs
              .map((s) => products.find((p) => p.slug === s))
              .filter(Boolean);
            return (
              <article className="featured-comparison-card" key={item.id}>
                <span>{item.categoryLabel}</span>
                <h3>{item.title}</h3>
                <p>{item.subtitle}</p>
                <div className="featured-product-pair">
                  {pairProducts.slice(0, 2).map((prod, idx) => (
                    <span key={prod!.slug}>
                      <b>OPTION 0{idx + 1}</b>
                      {prod!.name} ({prod!.priceLabel})
                    </span>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => launchComparisonPreset(item.slugs)}
                >
                  Compare {item.slugs.length} models side-by-side <span>↗</span>
                </button>
              </article>
            );
          })}
        </div>
      </section>

      {/* 5. Interactive Catalog Explorer with Instant Search, Filter & Sort */}
      <section className="catalog-section" id="catalog">
        <div className="section-heading">
          <div>
            <div className="eyebrow">
              <span className="eyebrow-stroke" />
              03 — PRODUCT CATALOG EXPLORER
            </div>
            <h2>
              Filter, sort & <em>compare.</em>
            </h2>
          </div>
          <p>
            Showing {filteredCatalog.length} of {products.length} demo products. Add up to 5
            products from any category to compare their capabilities.
          </p>
        </div>

        <div className="catalog-tools">
          <div className="catalog-search">
            <span aria-hidden="true">⌕</span>
            <label className="sr-only" htmlFor="catalog-search-input">
              Search products, specs, or use cases
            </label>
            <input
              id="catalog-search-input"
              type="search"
              value={catalogSearch}
              onChange={(e) => setCatalogSearch(e.target.value)}
              placeholder="Search by name, capability, or need (e.g. OLED, compact, quiet)…"
            />
            {catalogSearch && (
              <button
                type="button"
                onClick={() => setCatalogSearch("")}
                aria-label="Clear search query"
              >
                ×
              </button>
            )}
          </div>

          <label>
            <span>Category</span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="all">All categories ({products.length})</option>
              {categories.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.name} ({c.count})
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>Budget</span>
            <select
              value={maxPrice ?? ""}
              onChange={(e) =>
                setMaxPrice(e.target.value ? Number(e.target.value) : undefined)
              }
            >
              <option value="">Any price</option>
              <option value="100">Under €100</option>
              <option value="300">Under €300</option>
              <option value="500">Under €500</option>
              <option value="1000">Under €1,000</option>
              <option value="1500">Under €1,500</option>
            </select>
          </label>

          <label>
            <span>Sort by</span>
            <select
              value={sortBy}
              onChange={(e) =>
                setSortBy(e.target.value as NonNullable<CatalogFilterOptions["sortBy"]>)
              }
            >
              <option value="popularity">Most Popular</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
            </select>
          </label>

          {(catalogSearch || selectedCategory !== "all" || maxPrice !== undefined || sortBy !== "popularity") && (
            <button
              type="button"
              className="clear-filters"
              onClick={() => {
                setCatalogSearch("");
                setSelectedCategory("all");
                setMaxPrice(undefined);
                setSortBy("popularity");
              }}
            >
              Reset filters ×
            </button>
          )}
        </div>

        {filteredCatalog.length > 0 ? (
          <div className="product-grid">
            {filteredCatalog.map((product, index) => (
              <ProductCard key={product.slug} product={product} rank={index + 1} />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <strong>No products match your current filter combination.</strong>
            <span>Try raising the price ceiling or clearing the search keyword.</span>
          </div>
        )}

        <div className="catalog-footnote">
          <span>◎</span> Every product record includes structured specifications, strengths,
          tradeoffs, and best-fit user needs.
        </div>
      </section>

      {/* 6. Editorial Independence & Trust Section */}
      <section className="trust-section">
        <div className="trust-number">
          04 <span>—</span> TRANSPARENT COMPARISON
        </div>
        <div>
          <h2>
            Built for clarity, <em>not clicks.</em>
          </h2>
          <p>
            SideBySide doesn’t push single "winner" scores or paid rankings. Every person uses a
            product differently — so we lay out the capabilities, specifications, and honest
            tradeoffs side-by-side so you can choose what fits your life.
          </p>
          <Link href="/compare">
            Open the comparison workspace <span>↗</span>
          </Link>
        </div>
        <div className="trust-seal" aria-hidden="true">
          <span>
            NO PAID
            <br />
            RANKINGS OR
            <br />
            SCORES
          </span>
          <i>✓</i>
        </div>
      </section>

      {message && (
        <div className="notice-overlay" onClick={() => setMessage("")}>
          <div
            className="notice-dialog"
            role="alertdialog"
            aria-modal="true"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="notice-close"
              onClick={() => setMessage("")}
              aria-label="Close"
            >
              ×
            </button>
            <span className="eyebrow">SIDEBYSIDE ADVISOR</span>
            <p>{message}</p>
            <button type="button" className="notice-ok" onClick={() => setMessage("")}>
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
}
