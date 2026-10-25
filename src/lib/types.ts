export type Category = {
  slug: string;
  name: string;
  icon: string;
  description: string;
  count: number;
  featuredSpecs?: string[];
};

export type SpecValue = {
  value: string;
  numericValue?: number;
  unit?: string;
  higherIsBetter?: boolean;
  group?: "Display & Design" | "Performance & Hardware" | "Battery & Power" | "Connectivity & Ports" | "Camera & Audio" | "Ownership & Longevity" | "Formulation & Care";
};

export type LabRatings = {
  overall: number; // 0-100
  value: number; // 0-100
  performance: number; // 0-100
  longevity: number; // 0-100
  ergonomics: number; // 0-100
  subscores: Record<string, number>; // e.g., { "Camera Quality": 91, "Battery Endurance": 94 }
};

export type EditorialVerdict = {
  award?: "Editor's Choice" | "Best Value" | "Best Compact" | "Best Performance" | "Top Pick" | "Quiet Comfort";
  summary: string;
  bestFor: string[];
  avoidIf: string[];
  testedDate: string;
  methodologyNote: string;
};

export type ReviewItem = {
  id: string;
  type: "editorial" | "customer" | "lab";
  source: string;
  author: string;
  title: string;
  content: string;
  rating: number; // out of 5 or 100
  publishedAt: string;
  verified: boolean;
  pros?: string[];
  cons?: string[];
};

export type PriceOfferItem = {
  id: string;
  retailer: string;
  country: string;
  priceEur: number;
  originalPriceEur?: number;
  inStock: boolean;
  shippingNote: string;
  deliveryDays: string;
  url: string;
  isAffiliate: boolean;
  checkedAt: string;
  trustScore: number; // e.g. 98%
};

export type PricePoint = {
  month: string;
  lowEur: number;
  avgEur: number;
};

export type Product = {
  slug: string;
  name: string;
  brand: string;
  category: string;
  categoryName: string;
  priceEur: number;
  priceLabel: string;
  releaseYear: number;
  model: string;
  description: string;
  specs: Record<string, string>;
  structuredSpecs: Record<string, SpecValue>;
  pros: string[];
  cons: string[];
  dataType: "fictional-demo";
  popularity: number;
  color: string;
  keywords: string[];
  useCases: string[];
  labRatings: LabRatings;
  verdict: EditorialVerdict;
  reviews: ReviewItem[];
  offers: PriceOfferItem[];
  priceHistory: PricePoint[];
  aiReviewSummary: {
    consensus: string;
    praised: string[];
    criticized: string[];
    sentimentScore: number; // 0-100
  };
};

export type AdvisorPriority = "balanced" | "value" | "performance" | "longevity" | "compact" | "camera" | "battery" | "quiet";

export type ParsedIntent = {
  rawQuery: string;
  detectedCategory?: string;
  detectedCategoryName?: string;
  detectedBudget?: number;
  detectedPriorities: string[];
  detectedUseCases: string[];
  excludedTerms: string[];
};

export type ScoreBreakdown = {
  budgetFit: number; // 0-100
  useCaseFit: number; // 0-100
  labScoreFit: number; // 0-100
  valueScoreFit: number; // 0-100
  longevityFit: number; // 0-100
};

export type AdvisorResult = {
  product: Product;
  compatibility: number;
  roleLabel: "Best Overall Fit" | "Best Value Alternative" | "Performance Upgrade" | "Compact Pick" | "Strong Contender";
  reasons: string[];
  strengths: string[];
  tradeoffs: string[];
  scoreBreakdown: ScoreBreakdown;
};

export type AdvisorResponse = {
  results: AdvisorResult[];
  intent: ParsedIntent;
  headToHeadSummary?: {
    topPickSlug: string;
    runnerUpSlug: string;
    priceDeltaEur: number;
    keyAdvantageTop: string;
    keyAdvantageRunnerUp: string;
  };
  followUpSuggestions: string[];
  mode: string;
  dataNotice: string;
};

export type ComparisonCriteriaWeights = {
  value: number; // 1-5
  performance: number; // 1-5
  longevity: number; // 1-5
  ergonomics: number; // 1-5
};

export type PriceAlertSubscription = {
  slug: string;
  targetPriceEur: number;
  email?: string;
  createdAt: string;
};
