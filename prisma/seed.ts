import { PrismaClient, Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";
import {
  demoCompany,
  seedTenders,
} from "../src/server/data/fixtures";

const prisma = new PrismaClient();

/**
 * Seed Postgres from the canonical fixtures (Build Spec section 11) so the DB
 * matches the in-memory runtime data exactly. The fixtures use only type-only
 * imports, so this file runs cleanly under tsx without path-alias resolution.
 *
 * Demo login:  ali@hassantextiles.pk  /  tendx-demo
 */
async function main() {
  // Demo company: PPRA registered, ~PKR 31M avg turnover, textile experience,
  // no ISO 9001 on file (Build Spec section 11).
  const company = await prisma.company.upsert({
    where: { id: demoCompany.id },
    update: {},
    create: {
      id: demoCompany.id,
      legalName: demoCompany.legalName,
      ntn: "1234567-8",
      gstReg: "32-77-8899-001-46",
      ppraRegStatus: demoCompany.ppraRegistered ? "registered" : "not_registered",
      turnoverByYear: { "2023": 28_000_000, "2024": 31_000_000, "2025": 34_000_000 },
      certifications: demoCompany.certifications,
      categoryExperience: demoCompany.categoryExperience,
      city: demoCompany.city,
      province: demoCompany.province,
    },
  });

  const passwordHash = await bcrypt.hash("tendx-demo", 10);
  await prisma.user.upsert({
    where: { email: "ali@hassantextiles.pk" },
    update: {},
    create: {
      name: "Ali Hassan",
      email: "ali@hassantextiles.pk",
      role: "owner",
      passwordHash,
      companyId: company.id,
    },
  });

  await prisma.subscription.upsert({
    where: { id: "22222222-2222-2222-2222-222222222222" },
    update: {},
    create: {
      id: "22222222-2222-2222-2222-222222222222",
      companyId: company.id,
      plan: "professional",
      status: "active",
      currentPeriodEnd: new Date("2026-12-31"),
    },
  });

  // Four sample tenders + their match scores (Build Spec section 11).
  for (const seed of seedTenders) {
    const { match, extracted, ...t } = seed;
    await prisma.tender.upsert({
      where: { id: t.id },
      update: {},
      create: {
        id: t.id,
        sourcePortal: t.sourcePortal,
        title: t.title,
        buyer: t.buyer,
        sector: t.sector,
        category: t.category,
        valuePkr: BigInt(t.valuePkr),
        city: t.city,
        province: t.province,
        buyerType: t.buyerType,
        refNo: t.refNo,
        publishedAt: new Date(t.publishedAt),
        closesAt: new Date(t.closesAt),
        doc: extracted
          ? ({ extracted } as unknown as Prisma.InputJsonValue)
          : undefined,
      },
    });

    await prisma.tenderMatch.upsert({
      where: {
        tenderId_companyId: { tenderId: t.id, companyId: company.id },
      },
      update: { score: match.score },
      create: {
        tenderId: t.id,
        companyId: company.id,
        score: match.score,
        eligibility: match.eligibility as unknown as Prisma.InputJsonValue,
      },
    });
  }

  // A couple of suppliers for the Supplier Hub (Phase 3).
  await prisma.supplier.upsert({
    where: { id: "cccccccc-0000-0000-0000-000000000001" },
    update: {},
    create: {
      id: "cccccccc-0000-0000-0000-000000000001",
      name: "Faisalabad Textile Mills",
      origin: "local",
      categories: ["Textiles", "Lining fabric"],
      unitCosts: { lining_fabric_m: 320 },
      location: "Faisalabad",
    },
  });
  await prisma.supplier.upsert({
    where: { id: "cccccccc-0000-0000-0000-000000000002" },
    update: {},
    create: {
      id: "cccccccc-0000-0000-0000-000000000002",
      name: "Guangzhou Fabrics Co",
      origin: "import",
      categories: ["Textiles"],
      unitCosts: { lining_fabric_m: 290 },
      location: "Guangzhou, CN",
    },
  });

  console.log("Seed complete. Demo login: ali@hassantextiles.pk / tendx-demo");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
