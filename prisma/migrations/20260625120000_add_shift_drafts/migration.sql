CREATE TABLE "ShiftDraftAssignment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "shiftType" "ShiftType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShiftDraftAssignment_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ShiftDraftAssignment_userId_date_key"
ON "ShiftDraftAssignment"("userId", "date");

CREATE INDEX "ShiftDraftAssignment_date_idx"
ON "ShiftDraftAssignment"("date");

ALTER TABLE "ShiftDraftAssignment"
ADD CONSTRAINT "ShiftDraftAssignment_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
