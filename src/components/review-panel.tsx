"use client";

import { useState } from "react";
import type { Product } from "@/lib/types";

const reviewTabs = [
  { id: "summary", label: "AI summary" },
  { id: "editorial", label: "Editorial" },
  { id: "customer", label: "Customer" },
] as const;

export function ReviewPanel({ product }: { product?: Product }) {
  const [active, setActive] = useState<(typeof reviewTabs)[number]["id"]>("summary");

  if (!product) {
    return (
      <div className="detail-review-panel">
        <div className="review-empty-state">
          <span className="review-empty-icon">◎</span>
          <div>
            <strong>Review perspectives</strong>
            <p>Editorial, customer, and AI summaries are kept separate with no arbitrary ratings.</p>
          </div>
        </div>
      </div>
    );
  }

  const filteredReviews = product.reviews.filter((r) =>
    active === "editorial" ? r.type === "editorial" || r.type === "lab" : r.type === "customer"
  );

  return (
    <div className="detail-review-panel">
      <div className="review-tabs" role="tablist" aria-label="Review sources">
        {reviewTabs.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            id={`tab-${item.id}`}
            aria-selected={item.id === active}
            aria-controls={`panel-${item.id}`}
            className={item.id === active ? "active" : ""}
            onClick={() => setActive(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div
        id={`panel-${active}`}
        role="tabpanel"
        aria-labelledby={`tab-${active}`}
        className="review-panel-body"
      >
        {active === "summary" ? (
          <div className="ai-consensus-view">
            <div className="ai-consensus-header">
              <div>
                <span className="eyebrow">SEPARATED PERSPECTIVE SYNTHESIS · DEMO</span>
                <h3>What reviewers & owners consistently notice</h3>
              </div>
            </div>
            <p className="ai-consensus-copy">{product.aiReviewSummary.consensus}</p>
            <div className="consensus-columns">
              <div className="consensus-box">
                <strong>Commonly appreciated capabilities</strong>
                <ul>
                  {product.aiReviewSummary.praised.map((item) => (
                    <li key={item}>＋ {item}</li>
                  ))}
                </ul>
              </div>
              <div className="consensus-box">
                <strong>Commonly noted tradeoffs</strong>
                <ul>
                  {product.aiReviewSummary.criticized.map((item) => (
                    <li key={item}>− {item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        ) : (
          <div className="review-cards-list">
            {filteredReviews.map((rev) => (
              <article className="review-source-card" key={rev.id}>
                <div className="review-source-top">
                  <div>
                    <span className="review-source-badge">{rev.source}</span>
                    <h4>{rev.title}</h4>
                  </div>
                  <div className="review-rating-pill">
                    <small>{rev.publishedAt}</small>
                  </div>
                </div>
                <p>{rev.content}</p>
                <div className="review-source-foot">
                  <span>By {rev.author}</span>
                  <span>{rev.verified ? "✓ Attributed Demo Source" : "Unverified"}</span>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
