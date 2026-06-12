-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('owner', 'member', 'admin');

-- CreateEnum
CREATE TYPE "Plan" AS ENUM ('free', 'professional', 'enterprise');

-- CreateEnum
CREATE TYPE "BuyerType" AS ENUM ('federal', 'provincial', 'military', 'soe', 'private');

-- CreateEnum
CREATE TYPE "BidStatus" AS ENUM ('drafted', 'win_ready', 'missing_docs', 'under_review', 'submitted');

-- CreateEnum
CREATE TYPE "BidDocumentType" AS ENUM ('cover_letter', 'technical_proposal', 'financial_bid', 'compliance_checklist', 'certificate');

-- CreateEnum
CREATE TYPE "BidDocumentStatus" AS ENUM ('ai_generated', 'drafted', 'ready', 'missing');

-- CreateEnum
CREATE TYPE "SupplierOrigin" AS ENUM ('local', 'import');

-- CreateTable
CREATE TABLE "companies" (
    "company_id" TEXT NOT NULL,
    "legal_name" TEXT NOT NULL,
    "ntn" TEXT,
    "gst_reg" TEXT,
    "ppra_reg_status" TEXT,
    "turnover_by_year" JSONB,
    "certifications" JSONB,
    "category_experience" JSONB,
    "city" TEXT,
    "province" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "companies_pkey" PRIMARY KEY ("company_id")
);

-- CreateTable
CREATE TABLE "users" (
    "user_id" TEXT NOT NULL,
    "company_id" TEXT,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'owner',
    "password_hash" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "subscriptions" (
    "sub_id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "plan" "Plan" NOT NULL DEFAULT 'free',
    "status" TEXT NOT NULL DEFAULT 'active',
    "current_period_end" TIMESTAMP(3),
    "billing_ref" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("sub_id")
);

-- CreateTable
CREATE TABLE "tenders" (
    "tender_id" TEXT NOT NULL,
    "source_portal" TEXT,
    "title" TEXT NOT NULL,
    "buyer" TEXT,
    "sector" TEXT,
    "category" TEXT,
    "value_pkr" BIGINT,
    "city" TEXT,
    "province" TEXT,
    "buyer_type" "BuyerType",
    "published_at" TIMESTAMP(3),
    "closes_at" TIMESTAMP(3),
    "ref_no" TEXT,
    "doc_ref" JSONB,
    "raw_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tenders_pkey" PRIMARY KEY ("tender_id")
);

-- CreateTable
CREATE TABLE "tender_matches" (
    "match_id" TEXT NOT NULL,
    "tender_id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "score" DECIMAL(65,30) NOT NULL,
    "eligibility" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tender_matches_pkey" PRIMARY KEY ("match_id")
);

-- CreateTable
CREATE TABLE "bids" (
    "bid_id" TEXT NOT NULL,
    "match_id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "status" "BidStatus" NOT NULL DEFAULT 'drafted',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "submitted_at" TIMESTAMP(3),

    CONSTRAINT "bids_pkey" PRIMARY KEY ("bid_id")
);

-- CreateTable
CREATE TABLE "bid_documents" (
    "document_id" TEXT NOT NULL,
    "bid_id" TEXT NOT NULL,
    "type" "BidDocumentType" NOT NULL,
    "status" "BidDocumentStatus" NOT NULL,
    "storage_url" TEXT,
    "content_ref" JSONB,

    CONSTRAINT "bid_documents_pkey" PRIMARY KEY ("document_id")
);

-- CreateTable
CREATE TABLE "suppliers" (
    "supplier_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "origin" "SupplierOrigin" NOT NULL,
    "categories" JSONB,
    "unit_costs" JSONB,
    "location" TEXT,

    CONSTRAINT "suppliers_pkey" PRIMARY KEY ("supplier_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "tender_matches_tender_id_company_id_key" ON "tender_matches"("tender_id", "company_id");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("company_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("company_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tender_matches" ADD CONSTRAINT "tender_matches_tender_id_fkey" FOREIGN KEY ("tender_id") REFERENCES "tenders"("tender_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tender_matches" ADD CONSTRAINT "tender_matches_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("company_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bids" ADD CONSTRAINT "bids_match_id_fkey" FOREIGN KEY ("match_id") REFERENCES "tender_matches"("match_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bids" ADD CONSTRAINT "bids_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("company_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bid_documents" ADD CONSTRAINT "bid_documents_bid_id_fkey" FOREIGN KEY ("bid_id") REFERENCES "bids"("bid_id") ON DELETE RESTRICT ON UPDATE CASCADE;

