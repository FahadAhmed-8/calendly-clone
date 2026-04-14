-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "timezone" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventType" (
    "id" TEXT NOT NULL,
    "hostId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "durationMinutes" INTEGER NOT NULL,
    "description" TEXT,
    "color" TEXT NOT NULL DEFAULT '#0054cc',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "bufferBeforeMinutes" INTEGER NOT NULL DEFAULT 0,
    "bufferAfterMinutes" INTEGER NOT NULL DEFAULT 0,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EventType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AvailabilitySchedule" (
    "id" TEXT NOT NULL,
    "hostId" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'Working Hours',
    "timezone" TEXT NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AvailabilitySchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AvailabilityRule" (
    "id" TEXT NOT NULL,
    "scheduleId" TEXT NOT NULL,
    "weekday" INTEGER NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,

    CONSTRAINT "AvailabilityRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DateOverride" (
    "id" TEXT NOT NULL,
    "scheduleId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "blocks" JSONB NOT NULL,

    CONSTRAINT "DateOverride_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomQuestion" (
    "id" TEXT NOT NULL,
    "eventTypeId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'text',
    "options" JSONB,
    "required" BOOLEAN NOT NULL DEFAULT false,
    "position" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "CustomQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Booking" (
    "id" TEXT NOT NULL,
    "eventTypeId" TEXT NOT NULL,
    "hostId" TEXT NOT NULL,
    "inviteeName" TEXT NOT NULL,
    "inviteeEmail" TEXT NOT NULL,
    "inviteeTimezone" TEXT NOT NULL,
    "startUtc" TIMESTAMP(3) NOT NULL,
    "endUtc" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'confirmed',
    "cancellationTokenHash" TEXT NOT NULL,
    "cancelledAt" TIMESTAMP(3),
    "cancelReason" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Booking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BookingAnswer" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "answer" TEXT NOT NULL,

    CONSTRAINT "BookingAnswer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE INDEX "EventType_hostId_idx" ON "EventType"("hostId");

-- CreateIndex
CREATE UNIQUE INDEX "EventType_hostId_slug_key" ON "EventType"("hostId", "slug");

-- CreateIndex
CREATE INDEX "AvailabilitySchedule_hostId_idx" ON "AvailabilitySchedule"("hostId");

-- CreateIndex
CREATE INDEX "AvailabilityRule_scheduleId_weekday_idx" ON "AvailabilityRule"("scheduleId", "weekday");

-- CreateIndex
CREATE UNIQUE INDEX "DateOverride_scheduleId_date_key" ON "DateOverride"("scheduleId", "date");

-- CreateIndex
CREATE INDEX "CustomQuestion_eventTypeId_idx" ON "CustomQuestion"("eventTypeId");

-- CreateIndex
CREATE INDEX "Booking_hostId_startUtc_idx" ON "Booking"("hostId", "startUtc");

-- CreateIndex
CREATE INDEX "Booking_eventTypeId_startUtc_idx" ON "Booking"("eventTypeId", "startUtc");

-- CreateIndex
CREATE INDEX "Booking_inviteeEmail_idx" ON "Booking"("inviteeEmail");

-- CreateIndex
CREATE INDEX "BookingAnswer_bookingId_idx" ON "BookingAnswer"("bookingId");

-- AddForeignKey
ALTER TABLE "EventType" ADD CONSTRAINT "EventType_hostId_fkey" FOREIGN KEY ("hostId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AvailabilitySchedule" ADD CONSTRAINT "AvailabilitySchedule_hostId_fkey" FOREIGN KEY ("hostId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AvailabilityRule" ADD CONSTRAINT "AvailabilityRule_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "AvailabilitySchedule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DateOverride" ADD CONSTRAINT "DateOverride_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "AvailabilitySchedule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomQuestion" ADD CONSTRAINT "CustomQuestion_eventTypeId_fkey" FOREIGN KEY ("eventTypeId") REFERENCES "EventType"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_eventTypeId_fkey" FOREIGN KEY ("eventTypeId") REFERENCES "EventType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_hostId_fkey" FOREIGN KEY ("hostId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingAnswer" ADD CONSTRAINT "BookingAnswer_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingAnswer" ADD CONSTRAINT "BookingAnswer_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "CustomQuestion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
