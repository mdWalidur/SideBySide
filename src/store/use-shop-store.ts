"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ComparisonCriteriaWeights, PriceAlertSubscription } from "@/lib/types";

type ShopState = {
  wishlist: string[];
  comparison: string[];
  priceAlerts: PriceAlertSubscription[];
  criteriaWeights: ComparisonCriteriaWeights;
  toggleWishlist: (slug: string) => void;
  toggleComparison: (slug: string) => void;
  setComparison: (slugs: string[]) => void;
  removeComparison: (slug: string) => void;
  clearComparison: () => void;
  setCriteriaWeight: (key: keyof ComparisonCriteriaWeights, value: number) => void;
  resetCriteriaWeights: () => void;
  upsertPriceAlert: (alert: PriceAlertSubscription) => void;
  removePriceAlert: (slug: string) => void;
};

const defaultWeights: ComparisonCriteriaWeights = {
  value: 3,
  performance: 3,
  longevity: 3,
  ergonomics: 3,
};

export const useShopStore = create<ShopState>()(
  persist(
    (set) => ({
      wishlist: [],
      comparison: [],
      priceAlerts: [],
      criteriaWeights: defaultWeights,
      toggleWishlist: (slug) =>
        set((state) => ({
          wishlist: state.wishlist.includes(slug)
            ? state.wishlist.filter((item) => item !== slug)
            : [...state.wishlist, slug],
        })),
      toggleComparison: (slug) =>
        set((state) => ({
          comparison: state.comparison.includes(slug)
            ? state.comparison.filter((item) => item !== slug)
            : state.comparison.length < 3
              ? [...state.comparison, slug]
              : state.comparison,
        })),
      setComparison: (slugs) =>
        set({
          comparison: [...new Set(slugs)].slice(0, 3),
        }),
      removeComparison: (slug) =>
        set((state) => ({
          comparison: state.comparison.filter((item) => item !== slug),
        })),
      clearComparison: () => set({ comparison: [] }),
      setCriteriaWeight: (key, value) =>
        set((state) => ({
          criteriaWeights: {
            ...state.criteriaWeights,
            [key]: Math.max(1, Math.min(5, value)),
          },
        })),
      resetCriteriaWeights: () => set({ criteriaWeights: defaultWeights }),
      upsertPriceAlert: (alert) =>
        set((state) => ({
          priceAlerts: [
            ...state.priceAlerts.filter((item) => item.slug !== alert.slug),
            alert,
          ],
        })),
      removePriceAlert: (slug) =>
        set((state) => ({
          priceAlerts: state.priceAlerts.filter((item) => item.slug !== slug),
        })),
    }),
    { name: "sidebyside-local-shortlist", skipHydration: true }
  )
);

let hydrationPromise: Promise<void> | undefined;

export function ensureShopHydrated(): Promise<void> {
  try {
    if (typeof window === "undefined") return Promise.resolve();
    if (useShopStore.persist.hasHydrated()) return Promise.resolve();
    hydrationPromise ??= Promise.resolve(useShopStore.persist.rehydrate())
      .then(() => undefined)
      .catch(() => undefined)
      .finally(() => {
        hydrationPromise = undefined;
      });
    return hydrationPromise;
  } catch {
    return Promise.resolve();
  }
}
