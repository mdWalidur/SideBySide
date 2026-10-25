import { categories, products } from "@/lib/catalog";
import type {
  AdvisorPriority,
  AdvisorResponse,
  AdvisorResult,
  ParsedIntent,
  Product,
  ScoreBreakdown,
} from "@/lib/types";

export type RecommendationInput = {
  query?: string;
  category?: string;
  budget?: number;
  priority?: AdvisorPriority | string;
};

const categoryRegexMap: Array<{ slug: string; pattern: RegExp }> = [
  { slug: "cleaning", pattern: /\b(vacuum|vacuums|cordless cleaner|sweep|dust|pet hair|cleaning|floor|carpet)\b/i },
  { slug: "computers", pattern: /\b(gaming laptop|laptop|laptops|computer|computers|notebook|macbook|ultrabook|coding|study laptop)\b/i },
  { slug: "gaming", pattern: /\b(game console|console|handheld|play deck|steam deck|living room gaming)\b/i },
  { slug: "home", pattern: /\b(air purifier|purifier|hepa|allergies|pollen|air quality|bedroom air)\b/i },
  { slug: "phones", pattern: /\b(phone|phones|smartphone|smartphones|mobile|handset|android|ios)\b/i },
  { slug: "audio", pattern: /\b(headphone|headphones|earbud|earbuds|audio|anc|noise cancelling|over-ear)\b/i },
  { slug: "beauty", pattern: /\b(skin|skincare|beauty|moisturi[sz]er|balm|gel cream|ceramide|dry skin|sensitive skin)\b/i },
  { slug: "wearables", pattern: /\b(watch|smartwatch|wearable|wearables|fitness band|recovery strap|sleep tracker|running watch)\b/i },
  { slug: "tablets", pattern: /\b(tablet|tablets|ipad|slate|stylus|note-taking|e-reader)\b/i },
  { slug: "cameras", pattern: /\b(camera|cameras|mirrorless|aps-c|full-frame|street photography|lens)\b/i },
  { slug: "televisions", pattern: /\b(television|televisions|\btv\b|\btvs\b|oled tv|mini-led|home theater)\b/i },
  { slug: "networking", pattern: /\b(router|mesh|wi-fi|wifi|networking|ethernet)\b/i },
  { slug: "software", pattern: /\b(software|markdown|note app|productivity app|knowledge base)\b/i },
  { slug: "ai-tools", pattern: /\b(ai tool|ai assistant|llm|research assistant|synth)\b/i },
];

const priorityDetectionRules: Array<{ key: AdvisorPriority; label: string; pattern: RegExp }> = [
  { key: "value", label: "Value & Budget", pattern: /\b(budget|cheap|affordable|value|under|inexpensive|save|student)\b/i },
  { key: "performance", label: "Peak Performance", pattern: /\b(fast|performance|powerful|gaming|pro|studio|heavy|3d|video|4k|oled)\b/i },
  { key: "longevity", label: "Longevity & Support", pattern: /\b(durable|longevity|support|warranty|years|repair|replaceable|last)\b/i },
  { key: "compact", label: "Compact & Lightweight", pattern: /\b(compact|small|light|lightweight|mini|portable|one-handed|pocket|travel|commute)\b/i },
  { key: "camera", label: "Camera & Optics", pattern: /\b(camera|photo|photography|zoom|telephoto|portrait|video)\b/i },
  { key: "battery", label: "Battery Endurance", pattern: /\b(battery|runtime|endurance|all-day|multi-day|long life)\b/i },
  { key: "quiet", label: "Low Noise & Comfort", pattern: /\b(quiet|silent|sleep|anc|noise cancelling|calm|low noise)\b/i },
];

export function parseIntent(input: RecommendationInput): ParsedIntent {
  const rawQuery = (input.query ?? "").trim();
  const lower = rawQuery.toLowerCase();

  let detectedCategory = input.category && input.category !== "all" ? input.category : undefined;
  if (!detectedCategory) {
    for (const entry of categoryRegexMap) {
      if (entry.pattern.test(lower)) {
        detectedCategory = entry.slug;
        break;
      }
    }
  }
  if (!detectedCategory) {
    detectedCategory = categories.find((c) => lower.includes(c.name.toLowerCase()))?.slug;
  }

  const detectedCategoryName = detectedCategory
    ? categories.find((c) => c.slug === detectedCategory)?.name
    : undefined;

  const amount = String.raw`((?:\d{1,3}(?:[,\s.]\d{3})+|\d+))`;
  const budgetMention = rawQuery.match(
    new RegExp(String.raw`(?:under|below|less than|around|up to|max(?:imum)?|budget(?:\s+of)?|€|eur)\s*€?\s*${amount}`, "i")
  ) ?? rawQuery.match(new RegExp(String.raw`${amount}\s*(?:€|eur|euros)\b`, "i"));

  const parsedBudget = budgetMention ? Number(budgetMention[1].replace(/[,\s.]/g, "")) : undefined;
  const detectedBudget = input.budget !== undefined && input.budget > 0 ? input.budget : parsedBudget;

  const detectedPriorities: string[] = [];
  if (input.priority && input.priority !== "balanced") {
    detectedPriorities.push(input.priority);
  }
  for (const rule of priorityDetectionRules) {
    if (rule.pattern.test(lower) && !detectedPriorities.includes(rule.key)) {
      detectedPriorities.push(rule.key);
    }
  }

  const stopWords = new Set([
    "under", "below", "with", "good", "best", "need", "the", "for", "and", "that",
    "recommend", "find", "looking", "want", "something", "product", "around", "from", "into",
  ]);
  const detectedUseCases = lower
    .split(/[^a-z0-9]+/)
    .filter((term) => term.length > 2 && !/^\d+$/.test(term) && !stopWords.has(term))
    .slice(0, 6);

  return {
    rawQuery,
    detectedCategory,
    detectedCategoryName,
    detectedBudget,
    detectedPriorities,
    detectedUseCases,
    excludedTerms: [],
  };
}

export function buildAdvisorResponse(input: RecommendationInput): AdvisorResponse {
  const intent = parseIntent(input);
  const candidates = products.filter(
    (product) => !intent.detectedCategory || product.category === intent.detectedCategory
  );

  const scored = candidates.map((product) => {
    const reasons: string[] = [];
    const lab = product.labRatings;

    // 1. Budget fit (0 - 100)
    let budgetFit = 88;
    if (intent.detectedBudget !== undefined) {
      if (product.priceEur <= intent.detectedBudget) {
        const savings = intent.detectedBudget - product.priceEur;
        budgetFit = Math.min(100, 90 + Math.round((savings / Math.max(intent.detectedBudget, 1)) * 20));
        reasons.push(
          savings >= 50
            ? `Fits €${savings} under your €${intent.detectedBudget} target (${product.priceLabel}).`
            : `Fits cleanly within your €${intent.detectedBudget} budget (${product.priceLabel}).`
        );
      } else {
        const overageRatio = (product.priceEur - intent.detectedBudget) / Math.max(intent.detectedBudget, 1);
        budgetFit = Math.max(25, Math.round(78 - overageRatio * 110));
        reasons.push(
          `€${product.priceEur - intent.detectedBudget} above your €${intent.detectedBudget} target, included as a higher-tier benchmark.`
        );
      }
    }

    // 2. Use-case & keyword semantic match (0 - 100)
    const matchedTerms = intent.detectedUseCases.filter(
      (term) =>
        product.keywords.some((kw) => kw.toLowerCase().includes(term) || term.includes(kw.toLowerCase())) ||
        product.useCases.some((uc) => uc.toLowerCase().includes(term)) ||
        Object.entries(product.specs).some(([k, v]) => `${k} ${v}`.toLowerCase().includes(term)) ||
        product.description.toLowerCase().includes(term)
    );
    const useCaseFit = intent.detectedUseCases.length
      ? Math.min(99, 68 + matchedTerms.length * 11)
      : 84;

    if (matchedTerms.length > 0) {
      reasons.push(`Directly aligned with your focus on ${matchedTerms.slice(0, 3).join(", ")}.`);
    } else if (product.useCases.length > 0) {
      reasons.push(`Purpose-built for ${product.useCases.slice(0, 2).join(" and ")}.`);
    }

    // 3. Priority-weighted lab score (0 - 100)
    let priorityBonus = 0;
    for (const prio of intent.detectedPriorities) {
      if (prio === "value" && lab.value >= 92) {
        priorityBonus += 7;
        reasons.push(`High Lab Value Index (${lab.value}/100) for cost-to-performance.`);
      } else if (prio === "performance" && lab.performance >= 92) {
        priorityBonus += 7;
        reasons.push(`Top-tier Lab Performance score (${lab.performance}/100).`);
      } else if (prio === "longevity" && lab.longevity >= 92) {
        priorityBonus += 7;
        reasons.push(`Rated ${lab.longevity}/100 for long-term support & durability.`);
      } else if (prio === "compact" && lab.ergonomics >= 93) {
        priorityBonus += 7;
        reasons.push(`Scored ${lab.ergonomics}/100 in ergonomics & lightweight handling.`);
      } else if (
        (prio === "camera" || prio === "battery" || prio === "quiet") &&
        (product.keywords.includes(prio) ||
          Object.values(product.specs).some((v) => v.toLowerCase().includes(prio)))
      ) {
        priorityBonus += 6;
      }
    }

    if (product.verdict.award && reasons.length < 3) {
      reasons.push(`Carries our "${product.verdict.award}" distinction (${lab.overall}/100 overall lab score).`);
    }

    const breakdown: ScoreBreakdown = {
      budgetFit,
      useCaseFit,
      labScoreFit: lab.overall,
      valueScoreFit: lab.value,
      longevityFit: lab.longevity,
    };

    const rawComposite =
      budgetFit * 0.28 +
      useCaseFit * 0.27 +
      lab.overall * 0.25 +
      lab.value * 0.1 +
      lab.longevity * 0.1 +
      priorityBonus;

    const compatibility = Math.max(35, Math.min(99, Math.round(rawComposite)));

    return {
      product,
      compatibility,
      reasons: reasons.slice(0, 3),
      strengths: product.pros.slice(0, 2),
      tradeoffs: product.cons.slice(0, 2),
      scoreBreakdown: breakdown,
      popularity: product.popularity,
    };
  }).sort((a, b) => b.compatibility - a.compatibility || b.popularity - a.popularity);

  const topSlice = scored.slice(0, 4);

  const results: AdvisorResult[] = topSlice.map(({ popularity: _popularity, ...item }, index) => {
    let roleLabel: AdvisorResult["roleLabel"] = "Strong Contender";
    if (index === 0) {
      roleLabel = "Best Overall Fit";
    } else if (
      item.product.priceEur < topSlice[0].product.priceEur &&
      item.product.labRatings.value >= 92
    ) {
      roleLabel = "Best Value Alternative";
    } else if (item.product.labRatings.performance > topSlice[0].product.labRatings.performance) {
      roleLabel = "Performance Upgrade";
    } else if (item.product.labRatings.ergonomics >= 95) {
      roleLabel = "Compact Pick";
    }
    return {
      ...item,
      roleLabel,
    };
  });

  const headToHeadSummary =
    results.length >= 2
      ? {
          topPickSlug: results[0].product.slug,
          runnerUpSlug: results[1].product.slug,
          priceDeltaEur: Math.abs(results[0].product.priceEur - results[1].product.priceEur),
          keyAdvantageTop: results[0].product.pros[0] ?? "Higher overall balance",
          keyAdvantageRunnerUp: results[1].product.pros[0] ?? "Distinctive feature set",
        }
      : undefined;

  const followUpSuggestions: string[] = [];
  if (intent.detectedCategory === "phones") {
    followUpSuggestions.push(
      "Prioritize compact one-handed phone under €400",
      "Phone with optical telephoto zoom for travel",
      "Phone with 5-year software support"
    );
  } else if (intent.detectedCategory === "computers") {
    followUpSuggestions.push(
      "Lightweight laptop for university with 18hr battery",
      "Creator laptop with 32 GB RAM and OLED screen",
      "Gaming laptop under €1,400 with dedicated GPU"
    );
  } else {
    followUpSuggestions.push(
      "Quiet air purifier for a bedroom under €260",
      "Over-ear headphones with multipoint for flights",
      "Handheld OLED gaming console with repairable SSD"
    );
  }

  return {
    results,
    intent,
    headToHeadSummary,
    followUpSuggestions,
    mode: "hybrid-multi-criteria-advisor-v2",
    dataNotice:
      "Recommendations are scored using multi-criteria utility analysis (Budget Fit, Use-Case Alignment, Lab Performance, Value Index, and Ownership Longevity) on our transparent demo catalog.",
  };
}

export function recommend(input: RecommendationInput): AdvisorResult[] {
  return buildAdvisorResponse(input).results;
}

export type CatalogFilterOptions = {
  query?: string;
  category?: string;
  maxPrice?: number;
  minRating?: number;
  brand?: string;
  sortBy?: "overall" | "value" | "price-asc" | "price-desc" | "popularity";
};

export function searchProducts(
  query: string,
  category?: string,
  maxPrice?: number,
  options?: Omit<CatalogFilterOptions, "query" | "category" | "maxPrice">
): Product[] {
  const normalized = query.toLowerCase().trim();
  const amount = String.raw`(?:\d{1,3}(?:[,\s.]\d{3})+|\d+)`;
  const queryWithoutBudget = normalized
    .replace(new RegExp(String.raw`(?:under|below|less than|up to|max(?:imum)?|budget(?:\s+of)?|around)\s*(?:€|eur)?\s*${amount}`, "gi"), " ")
    .replace(new RegExp(String.raw`(?:€|eur)\s*${amount}`, "gi"), " ")
    .replace(/\b(?:best|for|the|with|a|an)\b/g, " ");
  const terms = queryWithoutBudget
    .split(/[^a-z0-9]+/)
    .filter((term) => term.length > 1);
  const effectiveMaxPrice = maxPrice ?? parseIntent({ query }).detectedBudget;

  const filtered = products.filter((product) => {
    const matchesCategory = !category || category === "all" || product.category === category;
    const matchesBudget = effectiveMaxPrice === undefined || product.priceEur <= effectiveMaxPrice;
    const matchesBrand = !options?.brand || options.brand === "all" || product.brand === options.brand;
    const matchesRating =
      options?.minRating === undefined || product.labRatings.overall >= options.minRating;

    const haystack = [
      product.name,
      product.brand,
      product.model,
      product.description,
      product.categoryName,
      product.priceEur.toString(),
      ...product.keywords,
      ...product.useCases,
      ...Object.keys(product.specs),
      ...Object.values(product.specs),
    ]
      .join(" ")
      .toLowerCase();

    const matchesQuery =
      !terms.length ||
      terms.every(
        (term) =>
          haystack.includes(term) ||
          (term === "phone" && product.category === "phones") ||
          (term === "smartphone" && product.category === "phones") ||
          (term === "laptop" && product.category === "computers") ||
          (term === "tv" && product.category === "televisions")
      );

    return matchesCategory && matchesBudget && matchesBrand && matchesRating && matchesQuery;
  });

  const sortBy = options?.sortBy ?? "overall";
  return [...filtered].sort((a, b) => {
    if (sortBy === "price-asc") return a.priceEur - b.priceEur;
    if (sortBy === "price-desc") return b.priceEur - a.priceEur;
    if (sortBy === "value") return b.labRatings.value - a.labRatings.value || a.priceEur - b.priceEur;
    if (sortBy === "popularity") return b.popularity - a.popularity;
    return b.labRatings.overall - a.labRatings.overall || b.popularity - a.popularity;
  });
}
