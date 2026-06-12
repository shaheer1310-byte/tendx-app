-- CreateTable
CREATE TABLE "workspace_bids" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "tender_id" TEXT NOT NULL,
    "tender_title" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "documents" JSONB NOT NULL,
    "created_at" TEXT NOT NULL,
    "submitted_at" TEXT,

    CONSTRAINT "workspace_bids_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "workspace_bids_company_id_idx" ON "workspace_bids"("company_id");

