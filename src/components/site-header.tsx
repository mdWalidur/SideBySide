"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ensureShopHydrated, useShopStore } from "@/store/use-shop-store";
import { categories } from "@/lib/catalog";

export function SiteHeader() {
  const savedCount = useShopStore((state) => state.wishlist.length);
  const compareCount = useShopStore((state) => state.comparison.length);
  const alertCount = useShopStore((state) => state.priceAlerts.length);
  const [accountOpen, setAccountOpen] = useState(false);
  const detailsRef = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    void ensureShopHydrated();
    const storedTheme = localStorage.getItem("sidebyside-theme");
    if (storedTheme) document.documentElement.dataset.theme = storedTheme;
  }, []);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (
        detailsRef.current?.open &&
        e.target instanceof Node &&
        !detailsRef.current.contains(e.target)
      ) {
        detailsRef.current.open = false;
      }
    };
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  useEffect(() => {
    if (!accountOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAccountOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [accountOpen]);

  function toggleTheme() {
    const next = document.documentElement.dataset.theme !== "dark";
    document.documentElement.dataset.theme = next ? "dark" : "light";
    localStorage.setItem("sidebyside-theme", next ? "dark" : "light");
  }

  return (
    <header className="site-header">
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <Link className="brand" href="/" aria-label="SideBySide home">
        <span className="brand-symbol">
          s<span>/</span>s
        </span>
        <span className="brand-name">
          sidebyside<span className="brand-period">.</span>
        </span>
      </Link>
      <nav className="main-nav" aria-label="Main navigation">
        <Link href="/#advisor">AI Advisor</Link>
        <Link href="/#catalog">Explorer</Link>
        <details className="category-menu" ref={detailsRef}>
          <summary>
            Categories <span>⌄</span>
          </summary>
          <div className="category-menu-panel">
            {categories.map((category) => (
              <Link
                key={category.slug}
                href={`/categories/${category.slug}`}
                onClick={() => {
                  if (detailsRef.current) detailsRef.current.open = false;
                }}
              >
                <span>{category.icon}</span>
                {category.name}
                <small>{category.count}</small>
              </Link>
            ))}
          </div>
        </details>
        <Link href="/compare">
          Compare
          {compareCount > 0 && <span className="nav-count">{compareCount}</span>}
        </Link>
      </nav>
      <div className="header-tools">
        <Link className="saved-nav" href="/saved" aria-label={`Saved products (${savedCount})`}>
          <span>Saved</span>
          <span className="saved-count">{savedCount}</span>
        </Link>
        <button
          type="button"
          className="theme-toggle"
          onClick={toggleTheme}
          aria-label="Toggle dark mode"
          title="Toggle dark mode"
        >
          ◐
        </button>
        <button
          type="button"
          className="profile-button"
          onClick={() => setAccountOpen(true)}
          aria-label="Workspace & price alerts status"
          title="Workspace & price alerts"
        >
          {alertCount > 0 ? alertCount : "R"}
        </button>
      </div>
      {accountOpen && (
        <div className="notice-overlay" onClick={() => setAccountOpen(false)}>
          <div
            className="notice-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="account-title"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="notice-close"
              onClick={() => setAccountOpen(false)}
              aria-label="Close"
            >
              ×
            </button>
            <span className="eyebrow">YOUR SIDEBYSIDE WORKSPACE</span>
            <h2 id="account-title" className="dialog-title">
              Local-first shortlist & price alerts.
            </h2>
            <p>
              You currently have <strong>{savedCount} saved products</strong>,{" "}
              <strong>{compareCount} comparison items</strong>, and{" "}
              <strong>{alertCount} active price alerts</strong> stored locally in this browser.
              Connect a PostgreSQL + OAuth provider via <code>.env</code> to sync across devices.
            </p>
            <div className="dialog-actions-row">
              <Link href="/saved" className="notice-ok" onClick={() => setAccountOpen(false)}>
                View saved & alerts ↗
              </Link>
              <button type="button" className="notice-secondary" onClick={() => setAccountOpen(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
