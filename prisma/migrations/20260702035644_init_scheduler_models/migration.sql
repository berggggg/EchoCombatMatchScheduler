-- CreateTable
CREATE TABLE "GuildConfig" (
    "guildId" TEXT NOT NULL PRIMARY KEY,
    "upcomingEventsChannelId" TEXT,
    "reminderChannelId" TEXT,
    "pingRoleId" TEXT,
    "dmReminderOffsetsMinutes" TEXT NOT NULL DEFAULT '[720,60]',
    "roleReminderOffsetsMinutes" TEXT NOT NULL DEFAULT '[60,2]',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ScheduledEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "guildId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "startsAt" DATETIME NOT NULL,
    "creatorUserId" TEXT NOT NULL,
    "signupChannelId" TEXT,
    "signupMessageId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ScheduledSignup" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "eventId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ScheduledSignup_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "ScheduledEvent" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ReminderLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "eventId" TEXT NOT NULL,
    "offsetMinutes" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "sentAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ReminderLog_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "ScheduledEvent" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "ScheduledEvent_guildId_startsAt_idx" ON "ScheduledEvent"("guildId", "startsAt");

-- CreateIndex
CREATE INDEX "ScheduledSignup_userId_idx" ON "ScheduledSignup"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ScheduledSignup_eventId_userId_key" ON "ScheduledSignup"("eventId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "ReminderLog_eventId_offsetMinutes_type_key" ON "ReminderLog"("eventId", "offsetMinutes", "type");
