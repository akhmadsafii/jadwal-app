CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "requestId" TEXT,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Notification"
ADD CONSTRAINT "Notification_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "Notification_userId_isRead_createdAt_idx"
ON "Notification"("userId", "isRead", "createdAt");

CREATE INDEX "Notification_requestId_idx" ON "Notification"("requestId");

-- Show outstanding employee-to-employee swap requests that were created
-- before this notification table existed.
INSERT INTO "Notification" ("id", "userId", "requestId", "title", "message", "type")
SELECT
    md5(random()::text || clock_timestamp()::text || request."id"),
    request."swapWithUserId",
    request."id",
    'Permintaan tukar shift',
    'Ada permintaan tukar shift yang menunggu persetujuan Anda.',
    'SHIFT_SWAP_REQUEST'
FROM "ShiftRequest" AS request
WHERE request."type" = 'TUKAR_SHIFT'
  AND request."status" = 'PENDING'
  AND request."swapWithUserId" IS NOT NULL;
