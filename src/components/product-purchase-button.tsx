"use client";

import { useEffect, useState } from "react";
import { products } from "@/lib/catalog";
import type { PriceOfferItem } from "@/lib/types";
import { ensureShopHydrated, useShopStore } from "@/store/use-shop-store";

export function ProductPurchaseButton({
  slug,
  label = "Check price & buy",
}: {
  slug: string;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const [targetPrice, setTargetPrice] = useState<number>(0);
  const [targetPriceTouched, setTargetPriceTouched] = useState(false);
  const [priceError, setPriceError] = useState("");
  const [alertSaved, setAlertSaved] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState<PriceOfferItem | null>(null);

  const product = products.find((item) => item.slug === slug);
  const existingAlert = useShopStore((state) =>
    state.priceAlerts.find((a) => a.slug === slug)
  );
  const upsertPriceAlert = useShopStore((state) => state.upsertPriceAlert);
  const removePriceAlert = useShopStore((state) => state.removePriceAlert);

  useEffect(() => {
    if (product && !targetPriceTouched) {
      setTargetPrice(
        existingAlert?.targetPriceEur ?? Math.max(10, Math.round(product.priceEur * 0.9))
      );
    }
  }, [product, existingAlert?.targetPriceEur, targetPriceTouched]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        setSelectedOffer(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  if (!product) return null;

  async function saveAlert() {
    if (!product) return;
    if (!Number.isFinite(targetPrice) || targetPrice < 5 || targetPrice > product.priceEur) {
      setPriceError(`Enter a target from €5 to €${product.priceEur}.`);
      return;
    }
    await ensureShopHydrated();
    upsertPriceAlert({
      slug: product.slug,
      targetPriceEur: targetPrice,
      createdAt: new Date().toISOString().slice(0, 10),
    });
    setAlertSaved(true);
    window.setTimeout(() => setAlertSaved(false), 2500);
  }

  return (
    <>
      <button
        type="button"
        className="buy-button"
        onClick={() => {
          setSelectedOffer(null);
          setOpen(true);
        }}
        aria-label={`${label} for ${product.name}`}
      >
        {label} <span>↗</span>
      </button>
      {open && (
        <div
          className="notice-overlay"
          onClick={() => {
            setOpen(false);
            setSelectedOffer(null);
          }}
        >
          <div
            className="notice-dialog purchase-drawer-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby={`purchase-title-${product.slug}`}
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="notice-close"
              onClick={() => {
                setOpen(false);
                setSelectedOffer(null);
              }}
              aria-label="Close purchase options"
            >
              ×
            </button>
            <span className="eyebrow">TRANSPARENT RETAILER COMPARISON · DEMO</span>
            <h2 id={`purchase-title-${product.slug}`} className="dialog-title">
              {product.name} · {product.priceLabel}
            </h2>
            <p className="purchase-dialog-sub">
              Simulated merchant offers demonstrating SideBySide’s zero-dark-pattern affiliate
              disclosure, stock timestamps, and target price tracking.
            </p>

            {selectedOffer ? (
              <div className="drawer-checkout-handoff">
                <span className="eyebrow">MERCHANT HANDOFF PREVIEW · SIMULATED</span>
                <h3>Redirecting to {selectedOffer.retailer}</h3>
                <p>
                  <strong>Product:</strong> {product.name} ({product.model})
                  <br />
                  <strong>Verified Offer Price:</strong> €{selectedOffer.priceEur} (
                  {selectedOffer.shippingNote})
                  <br />
                  <strong>Estimated Delivery:</strong> {selectedOffer.deliveryDays}
                  <br />
                  <strong>Disclosure:</strong>{" "}
                  {selectedOffer.isAffiliate
                    ? "SideBySide earns a 4% referral commission at no additional cost to you."
                    : "Direct manufacturer store link (0% referral commission)."}
                </p>
                <div className="dialog-actions-row">
                  <button
                    type="button"
                    className="notice-ok"
                    onClick={() => setSelectedOffer(null)}
                  >
                    ← Back to all offers
                  </button>
                  <button
                    type="button"
                    className="notice-secondary"
                    onClick={() => {
                      setSelectedOffer(null);
                      setOpen(false);
                    }}
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <div className="drawer-offers-list">
                {product.offers.map((offer, idx) => (
                  <div className="drawer-offer-row" key={offer.id}>
                    <div className="drawer-offer-meta">
                      <strong>
                        {offer.retailer}{" "}
                        {idx === 0 && <span className="best-price-pill">BEST DEMO PRICE</span>}
                      </strong>
                      <span>
                        {offer.country} · {offer.shippingNote} · {offer.deliveryDays}
                      </span>
                      <small>
                        {offer.checkedAt} · Trust {offer.trustScore}% ·{" "}
                        {offer.isAffiliate
                          ? "Affiliate link (4% commission)"
                          : "Direct store (0% commission)"}
                      </small>
                    </div>
                    <div className="drawer-offer-price">
                      <b>€{offer.priceEur}</b>
                      {offer.originalPriceEur && <s>€{offer.originalPriceEur}</s>}
                      <button
                        type="button"
                        className="visit-store-btn"
                        onClick={() => setSelectedOffer(offer)}
                      >
                        Visit store ↗
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="drawer-alert-box">
              <div className="drawer-alert-header">
                <strong>Set a local price-drop alert</strong>
                {existingAlert && (
                  <span className="active-alert-badge">
                    Active target: €{existingAlert.targetPriceEur}
                  </span>
                )}
              </div>
              <p>
                Waiting for a seasonal dip? Set your target price in EUR to track it in your Saved
                workspace.
              </p>
              <div className="drawer-alert-controls">
                <label className="sr-only" htmlFor={`target-price-${product.slug}`}>
                  Target price in EUR
                </label>
                <div className="price-input-group">
                  <span>€</span>
                  <input
                    id={`target-price-${product.slug}`}
                    type="number"
                    min={5}
                    max={product.priceEur}
                    value={targetPrice}
                    aria-invalid={Boolean(priceError)}
                    onChange={(e) => {
                      setTargetPriceTouched(true);
                      setTargetPrice(e.target.value === "" ? 0 : Number(e.target.value));
                      setPriceError("");
                    }}
                  />
                </div>
                <button
                  type="button"
                  className="notice-ok"
                  onClick={() => void saveAlert()}
                  disabled={!Number.isFinite(targetPrice) || targetPrice < 5 || targetPrice > product.priceEur}
                >
                  {alertSaved ? "✓ Alert saved" : existingAlert ? "Update alert" : "Track price drop"}
                </button>
                {existingAlert && (
                  <button
                    type="button"
                    className="notice-secondary"
                    onClick={() => removePriceAlert(product.slug)}
                  >
                    Remove
                  </button>
                )}
              </div>
              {priceError && <p className="price-alert-error" role="alert">{priceError}</p>}
            </div>

            <div className="purchase-disclosure-foot">
              Editorial rankings and Lab scores are computed independently of merchant stock or
              commission rates. All merchants above are simulated demo records.
            </div>
          </div>
        </div>
      )}
    </>
  );
}
