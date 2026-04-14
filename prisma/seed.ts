import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Single default host
  const host = await prisma.user.upsert({
    where: { username: "fhd" },
    update: {},
    create: {
      username: "fhd",
      displayName: "Fhd",
      email: "fahadahmedgulamulrehman@gmail.com",
      timezone: "Asia/Kolkata",
      avatarUrl: null,
    },
  });

  // Wipe & reseed event types for idempotent dev seeding
  await prisma.bookingAnswer.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.customQuestion.deleteMany();
  await prisma.availabilityRule.deleteMany();
  await prisma.dateOverride.deleteMany();
  await prisma.availabilitySchedule.deleteMany();
  await prisma.eventType.deleteMany();

  const eventTypes = await Promise.all([
    prisma.eventType.create({
      data: {
        hostId: host.id,
        name: "15 Minute Meeting",
        slug: "15min",
        durationMinutes: 15,
        description: "A quick catch-up to align on a single topic.",
        color: "#10B981",
      },
    }),
    prisma.eventType.create({
      data: {
        hostId: host.id,
        name: "30 Minute Meeting",
        slug: "30min",
        durationMinutes: 30,
        description:
          "Welcome! Please select a convenient time for our discussion. We will cover project scope, timelines, and initial strategy alignment.",
        color: "#0054cc",
      },
    }),
    prisma.eventType.create({
      data: {
        hostId: host.id,
        name: "60 Minute Interview",
        slug: "interview",
        durationMinutes: 60,
        description: "Technical interview. Please share your portfolio in advance.",
        color: "#A855F7",
      },
    }),
  ]);

  // Default schedule: Mon–Fri 09:00–17:00 Asia/Kolkata
  const schedule = await prisma.availabilitySchedule.create({
    data: {
      hostId: host.id,
      name: "Working Hours",
      timezone: "Asia/Kolkata",
      isDefault: true,
    },
  });

  for (const weekday of [1, 2, 3, 4, 5]) {
    await prisma.availabilityRule.create({
      data: { scheduleId: schedule.id, weekday, startTime: "09:00", endTime: "17:00" },
    });
  }

  // Sample bookings: one past, one upcoming
  const now = new Date();
  const past = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
  past.setUTCHours(5, 0, 0, 0);
  const future = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);
  future.setUTCHours(6, 0, 0, 0);

  await prisma.booking.create({
    data: {
      eventTypeId: eventTypes[1].id,
      hostId: host.id,
      inviteeName: "Sarah Chen",
      inviteeEmail: "sarah@example.com",
      inviteeTimezone: "America/Los_Angeles",
      startUtc: past,
      endUtc: new Date(past.getTime() + 30 * 60 * 1000),
      status: "confirmed",
      cancellationTokenHash: "seed-past-token-hash",
      notes: "Discuss Q3 roadmap",
    },
  });

  await prisma.booking.create({
    data: {
      eventTypeId: eventTypes[0].id,
      hostId: host.id,
      inviteeName: "Marcus Lee",
      inviteeEmail: "marcus@example.com",
      inviteeTimezone: "Europe/London",
      startUtc: future,
      endUtc: new Date(future.getTime() + 15 * 60 * 1000),
      status: "confirmed",
      cancellationTokenHash: "seed-future-token-hash",
    },
  });

  console.log("Seed complete.");
  console.log("Host:", host.username, "  host id:", host.id);
  console.log("Event types:", eventTypes.map((e) => `${e.name} (/${host.username}/${e.slug})`).join(", "));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
