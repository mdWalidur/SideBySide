import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, ProductDataType } from "../src/generated/prisma/client";
import { categories, products } from "../src/lib/catalog";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("Set DATABASE_URL before seeding the catalog.");
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: databaseUrl }) });

async function main() {
  for (const category of categories) {
    const savedCategory = await prisma.category.upsert({
      where: { slug: category.slug },
      update: {
        name: category.name,
        description: category.description,
        icon: category.icon,
        featuredSpecs: category.featuredSpecs ?? [],
      },
      create: {
        slug: category.slug,
        name: category.name,
        description: category.description,
        icon: category.icon,
        featuredSpecs: category.featuredSpecs ?? [],
      },
    });
    for (const product of products.filter((entry) => entry.category === category.slug)) {
      await prisma.product.upsert({
        where: { slug: product.slug },
        update: {
          name: product.name,
          brand: product.brand,
          model: product.model,
          summary: product.description,
          categoryId: savedCategory.id,
          priceMinorUnits: product.priceEur * 100,
          releaseYear: product.releaseYear,
          specifications: product.specs,
          structuredSpecs: product.structuredSpecs,
          pros: product.pros,
          cons: product.cons,
          useCases: product.useCases,
          keywords: product.keywords,
          editorialAward: product.verdict.award,
          editorialVerdict: product.verdict,
          aiReviewSummary: product.aiReviewSummary,
          dataType: ProductDataType.FICTIONAL_DEMO,
          popularityScore: product.popularity,
          overallScore: product.labRatings.overall,
          valueScore: product.labRatings.value,
          performanceScore: product.labRatings.performance,
          longevityScore: product.labRatings.longevity,
          ergonomicsScore: product.labRatings.ergonomics,
        },
        create: {
          slug: product.slug,
          name: product.name,
          brand: product.brand,
          model: product.model,
          summary: product.description,
          categoryId: savedCategory.id,
          priceMinorUnits: product.priceEur * 100,
          releaseYear: product.releaseYear,
          specifications: product.specs,
          structuredSpecs: product.structuredSpecs,
          pros: product.pros,
          cons: product.cons,
          useCases: product.useCases,
          keywords: product.keywords,
          editorialAward: product.verdict.award,
          editorialVerdict: product.verdict,
          aiReviewSummary: product.aiReviewSummary,
          dataType: ProductDataType.FICTIONAL_DEMO,
          popularityScore: product.popularity,
          overallScore: product.labRatings.overall,
          valueScore: product.labRatings.value,
          performanceScore: product.labRatings.performance,
          longevityScore: product.labRatings.longevity,
          ergonomicsScore: product.labRatings.ergonomics,
        },
      });
    }
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exitCode = 1;
  });
