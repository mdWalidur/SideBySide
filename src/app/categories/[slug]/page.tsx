import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductCard } from "@/components/product-card";
import { categories, getCategory, getProductsByCategory } from "@/lib/catalog";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return categories.map((category) => ({ slug: category.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const category = getCategory(slug);
  return category
    ? {
        title: `${category.name} — Compare Capabilities & Specs`,
        description: `${category.description} Compare ${category.count} ${category.name.toLowerCase()} models side-by-side.`,
      }
    : { title: "Category not found" };
}

export default async function CategoryPage({ params }: Props) {
  const { slug } = await params;
  const category = getCategory(slug);
  if (!category) notFound();
  const items = getProductsByCategory(slug);
  const allSlugs = items.slice(0, 5).map((p) => p.slug);

  return (
    <section className="category-page">
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <Link href="/">Discover</Link>
        <span>/</span>
        <strong>{category.name}</strong>
      </nav>

      <div className="category-page-heading">
        <span className="category-page-icon" aria-hidden="true">
          {category.icon}
        </span>
        <div style={{ flex: 1 }}>
          <div className="eyebrow">
            <span className="eyebrow-stroke" />
            EXPLORE A CATEGORY · {items.length} MODELS
          </div>
          <h1>
            {category.name}, <em>thoughtfully.</em>
          </h1>
          <p>{category.description}</p>
        </div>
        {items.length >= 2 && (
          <Link
            href={`/compare?slugs=${allSlugs.join(",")}`}
            className="compare-all-shortlist-btn"
          >
            Compare all {items.length} {category.name.toLowerCase()} side-by-side <span>↔</span>
          </Link>
        )}
      </div>

      {category.featuredSpecs && category.featuredSpecs.length > 0 && (
        <div className="category-criteria-strip">
          <span>KEY CAPABILITIES TO COMPARE:</span>
          {category.featuredSpecs.map((spec) => (
            <b key={spec}>{spec}</b>
          ))}
        </div>
      )}

      {items.length ? (
        <div className="product-grid">
          {items.map((product, index) => (
            <ProductCard key={product.slug} product={product} rank={index + 1} />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <strong>More products are on the way.</strong>
          <span>
            This category is part of the product taxonomy; verified catalog data has not been
            connected yet.
          </span>
          <Link href="/">Back to discovery ↗</Link>
        </div>
      )}

      <p className="demo-note">
        The products and product details shown here are fictional prototype records. Add two to five
        products to compare their capabilities side-by-side.
      </p>
    </section>
  );
}
