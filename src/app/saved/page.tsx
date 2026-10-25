import type { Metadata } from "next";
import { SavedProducts } from "@/components/saved-products";

export const metadata: Metadata = { title: "Saved products", description: "Your personal SideBySide product shortlist." };

export default function SavedPage() { return <SavedProducts />; }
