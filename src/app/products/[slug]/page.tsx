import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductActions } from "@/components/product-actions";
import { ProductArt } from "@/components/product-art";
import { ProductCard } from "@/components/product-card";
import { ReviewPanel } from "@/components/review-panel";
import { ProductPurchaseButton } from "@/components/product-purchase-button";
import { getCategory, getProduct, products } from "@/lib/catalog";
import type { SpecValue } from "@/lib/types";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return products.map((product) => ({ slug: product.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = getProduct(slug);
  if (!product) return { title: "Product not found" };
  return {
    title: `${product.name} (${product.model}) Capabilities, Specs & Comparison`,
    description: `${product.description} Compare ${product.name} capabilities, specifications, strengths, and tradeoffs on SideBySide.`,
    openGraph: {
      title: `${product.name} — Capabilities & Specs | SideBySide`,
      description: product.description,
    },
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = getProduct(slug);
  if (!product) notFound();

  const category = getCategory(product.category);
  const similar = products
    .filter((item) => item.category === product.category && item.slug !== product.slug)
    .slice(0, 3);

  // Group structured specs by category group
  const specGroups = new Map<string, Array<[string, SpecValue]>>();
  for (const [label, specVal] of Object.entries(product.structuredSpecs)) {
    const grp = specVal.group ?? "Performance & Hardware";
    const list = specGroups.get(grp) ?? [];
    list.push([label, specVal]);
    specGroups.set(grp, list);
  }

  const maxHistPrice = Math.max(...product.priceHistory.map((p) => p.avgEur), product.priceEur);
  const minHistPrice = Math.min(...product.priceHistory.map((p) => p.lowEur), product.priceEur);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    brand: { "@type": "Brand", name: product.brand },
    model: product.model,
    description: product.description,
    category: category?.name ?? product.categoryName,
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: "EUR",
      lowPrice: product.priceEur,
      highPrice: Math.max(...product.offers.map((o) => o.priceEur)),
      offerCount: product.offers.length,
    },
  };

  return (
    <div className="detail-page">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <Link href="/">Discover</Link>
        <span>/</span>
        <Link href={`/categories/${product.category}`}>
          {category?.name ?? product.categoryName}
        </Link>
        <span>/</span>
        <strong>{product.name}</strong>
      </nav>

      <section className="detail-hero">
        <div className="detail-art-wrap">
          <ProductArt product={product} large />
          <span className="detail-demo-stamp">FICTIONAL DEMO PRODUCT</span>
        </div>

        <div className="detail-summary">
          <div className="eyebrow">
            <span className="eyebrow-stroke" />
            {product.categoryName.toUpperCase()} · {product.brand.toUpperCase()}
          </div>
          <h1>{product.name}</h1>
          <p className="detail-model">{product.model}</p>
          <p className="detail-description">{product.description}</p>

          <div className="parsed-intent-chips" style={{ marginTop: "12px" }}>
            {product.useCases.map((uc) => (
              <span className="intent-chip" key={uc}>
                Suited for: <b>{uc}</b>
              </span>
            ))}
          </div>

          <div className="detail-price">
            <span>Sample price in EUR</span>
            <strong>{product.priceLabel}</strong>
            <small>
              Compared across {product.offers.length} simulated merchants · No single score imposed
            </small>
          </div>

          <ProductActions slug={product.slug} label="Add to side-by-side compare" />
          <ProductPurchaseButton slug={product.slug} label="Compare retailers & price alerts" />

          {similar.length > 0 && (
            <div className="quick-vs-links">
              <span>COMPARE CAPABILITIES DIRECTLY:</span>
              {similar.map((alt) => (
                <Link
                  key={alt.slug}
                  href={`/compare?slugs=${product.slug},${alt.slug}`}
                  className="vs-pill-link"
                >
                  vs. {alt.name} ↗
                </Link>
              ))}
            </div>
          )}

          <div className="detail-trust">
            <b>DATA PROVENANCE</b>
            <span>
              Fictional sample record · Capabilities & tradeoffs presented without arbitrary scores
            </span>
          </div>
        </div>
      </section>

      {/* User Needs & Fit Assessment Section (No scores) */}
      <section className="detail-section">
        <div className="section-heading">
          <div>
            <div className="eyebrow">
              <span className="eyebrow-stroke" />
              USER NEEDS & FIT
            </div>
            <h2>
              Who this fits <em>best.</em>
            </h2>
          </div>
          <p>Matched by real-world use cases and practical limitations rather than numeric ratings.</p>
        </div>
        <p className="detail-overview-copy">{product.description}</p>
        <div className="best-avoid-grid">
          <div className="best-for-box">
            <strong>✓ IDEAL FOR YOUR NEEDS IF YOU WANT</strong>
            <ul>
              {product.verdict.bestFor.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div className="avoid-if-box">
            <strong>× CONSIDER ANOTHER OPTION IF</strong>
            <ul>
              {product.verdict.avoidIf.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Grouped Technical Specifications */}
      <section className="detail-spec-section">
        <div className="detail-column-heading">
          <span>01 — SPECIFICATIONS & CAPABILITIES</span>
          <h2>Details at a glance.</h2>
          <p>
            Grouped by capability so you can quickly verify whether the hardware or formula meets
            your requirements.
          </p>
        </div>
        <div className="grouped-specs-wrap">
          {[...specGroups.entries()].map(([groupName, entries]) => (
            <div className="spec-group-block" key={groupName}>
              <h3 className="spec-group-title">{groupName}</h3>
              <dl className="spec-table">
                {entries.map(([label, specObj]) => (
                  <div className="spec-row" key={label}>
                    <dt>{label}</dt>
                    <dd>{specObj.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          ))}
        </div>
      </section>

      {/* Pros and Cons */}
      <section className="detail-pros-cons">
        <div>
          <span className="eyebrow">ILLUSTRATIVE STRENGTHS</span>
          <h2>
            Possible <em>upsides.</em>
          </h2>
          <ul>
            {product.pros.map((pro) => (
              <li key={pro}>
                <span>＋</span>
                {pro}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <span className="eyebrow">ILLUSTRATIVE TRADEOFFS</span>
          <h2>
            Things to <em>consider.</em>
          </h2>
          <ul>
            {product.cons.map((con) => (
              <li key={con}>
                <span>−</span>
                {con}
              </li>
            ))}
          </ul>
        </div>
        <p className="demo-note">
          These illustrative pros and cons are generated from demo copy to help you weigh practical
          tradeoffs.
        </p>
      </section>

      {/* Separated Review Perspectives */}
      <section className="detail-review-section">
        <div className="section-heading">
          <div>
            <div className="eyebrow">
              <span className="eyebrow-stroke" />
              02 — REVIEW SOURCES
            </div>
            <h2>
              Hear more <em>perspectives.</em>
            </h2>
          </div>
          <p>Editorial, community, and AI summaries are kept separate.</p>
        </div>
        <ReviewPanel product={product} />
      </section>

      {/* Purchase Decision & 6-Month Price Trajectory */}
      <section className="detail-buy" id="buy">
        <div>
          <div className="eyebrow">
            <span className="eyebrow-stroke" />
            03 — PURCHASE INFORMATION
          </div>
          <h2>
            Buy with <em>confidence.</em>
          </h2>
          <p>
            Retailer offers are listed with checked-at times and a clear affiliate disclosure
            (6-month demo range €{minHistPrice}–€{maxHistPrice}).
          </p>

          <div className="price-history-card">
            <div className="price-history-head">
              <strong>6-month sample price history (EUR)</strong>
              <span>
                Low: €{minHistPrice} · High: €{maxHistPrice}
              </span>
            </div>
            <div className="price-bars-grid">
              {product.priceHistory.map((pt) => {
                const heightPct = Math.max(25, Math.round((pt.lowEur / maxHistPrice) * 100));
                return (
                  <div className="price-bar-col" key={pt.month}>
                    <span className="price-bar-val">€{pt.lowEur}</span>
                    <div className="price-bar-track">
                      <div className="price-bar-fill" style={{ height: `${heightPct}%` }} />
                    </div>
                    <small>{pt.month}</small>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="retailer-preview">
          <div className="retailer-icon">↗</div>
          <strong>Sample Retailer Offers (Demo)</strong>
          <span>
            Compare delivery speed and affiliate status before clicking through.
          </span>
          <div className="inline-offers-table">
            {product.offers.map((offer, index) => (
              <div className="inline-offer-item" key={offer.id}>
                <div>
                  <strong>{offer.retailer}</strong>
                  <small>
                    {offer.deliveryDays} · {offer.checkedAt}
                  </small>
                </div>
                <div className="inline-offer-right">
                  <b>€{offer.priceEur}</b>
                  <span className={index === 0 ? "stock-tag best" : "stock-tag"}>
                    {index === 0 ? "Lowest offer" : "In stock"}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: "14px" }}>
            <ProductPurchaseButton
              slug={product.slug}
              label="Open retailer & price alert options"
            />
          </div>
        </div>
      </section>

      {similar.length > 0 && (
        <section className="detail-related">
          <div className="section-heading">
            <div>
              <div className="eyebrow">
                <span className="eyebrow-stroke" />
                SIMILAR PRODUCTS IN {category?.name.toUpperCase() ?? product.category.toUpperCase()}
              </div>
              <h2>
                Explore <em>alternatives.</em>
              </h2>
            </div>
            <Link href={`/categories/${product.category}`}>
              Browse all {category?.count ?? similar.length + 1} models <span>↗</span>
            </Link>
          </div>
          <div className="product-grid">
            {similar.map((item, index) => (
              <ProductCard key={item.slug} product={item} rank={index + 1} />
            ))}
          </div>
        </section>
      )}

      <div className="detail-data-footer">
        All product information on this prototype is fictional demo content. No single product
        ratings or scores are imposed.
      </div>
    </div>
  );
}
