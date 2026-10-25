import type { Metadata } from "next";
import { ComparisonWorkspace } from "@/components/comparison-workspace";

export const metadata: Metadata = { title: "Compare products", description: "Compare the product details that matter to you." };

export default function ComparePage() { return <ComparisonWorkspace />; }
