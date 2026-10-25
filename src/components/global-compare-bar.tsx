"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { products } from "@/lib/catalog";
import { useShopStore } from "@/store/use-shop-store";

export function GlobalCompareBar() {
  const [message, setMessage] = useState("");
  const [pendingCandidateSlug, setPendingCandidateSlug] = useState<string | null>(null);
  const selected = useShopStore((state) => state.comparison);
  const clear = useShopStore((state) => state.clearComparison);
  const setComparison = useShopStore((state) => state.setComparison);

  useEffect(() => {
    const invalid = (event: Event) => {
      const custom = event as CustomEvent<string | { message: string; candidateSlug?: string }>;
      if (typeof custom.detail === "string") {
        setMessage(custom.detail);
        setPendingCandidateSlug(null);
      } else {
        setMessage(custom.detail.message);
        setPendingCandidateSlug(custom.detail.candidateSlug ?? null);
      }
    };
    window.addEventListener("sidebyside:invalid-compare", invalid);
    return () => window.removeEventListener("sidebyside:invalid-compare", invalid);
  }, []);

  const names = selected
    .map((slug) => products.find((product) => product.slug === slug)?.name)
    .filter(Boolean);

  return (
    <>
      {message && (
        <div
          className="notice-overlay"
          onClick={() => {
            setMessage("");
            setPendingCandidateSlug(null);
          }}
        >
          <div
            className="notice-dialog"
            role="alertdialog"
            aria-modal="true"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="notice-close"
              onClick={() => {
                setMessage("");
                setPendingCandidateSlug(null);
              }}
              aria-label="Close"
            >
              ×
            </button>
            <span className="eyebrow">COMPARISON CATEGORY CONFLICT</span>
            <p>{message}</p>
            <div className="dialog-actions-row">
              {pendingCandidateSlug && (
                <button
                  type="button"
                  className="notice-ok"
                  onClick={() => {
                    setComparison([pendingCandidateSlug]);
                    setMessage("");
                    setPendingCandidateSlug(null);
                  }}
                >
                  Switch to new category
                </button>
              )}
              <button
                type="button"
                className={pendingCandidateSlug ? "notice-secondary" : "notice-ok"}
                onClick={() => {
                  setMessage("");
                  setPendingCandidateSlug(null);
                }}
              >
                {pendingCandidateSlug ? "Keep current selection" : "Got it"}
              </button>
            </div>
          </div>
        </div>
      )}
      {selected.length > 0 && (
        <div className="compare-float">
          <div>
            <span className="compare-float-icon">↔</span>
            <span>
              <strong>{selected.length} selected to compare</strong>
              <small>{names.join(" · ")}</small>
            </span>
          </div>
          <Link href={`/compare?slugs=${selected.join(",")}`}>
            Compare now <span>↗</span>
          </Link>
          <button
            type="button"
            onClick={clear}
            aria-label="Clear comparison selections"
          >
            ×
          </button>
        </div>
      )}
    </>
  );
}
