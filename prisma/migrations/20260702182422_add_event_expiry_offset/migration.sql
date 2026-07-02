-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_GuildConfig" (
    "guildId" TEXT NOT NULL PRIMARY KEY,
    "upcomingEventsChannelId" TEXT,
    "reminderChannelId" TEXT,
    "pingRoleId" TEXT,
    "dmReminderOffsetsMinutes" TEXT NOT NULL DEFAULT '[720,60]',
    "roleReminderOffsetsMinutes" TEXT NOT NULL DEFAULT '[60,2]',
    "eventExpiryOffsetMinutes" INTEGER NOT NULL DEFAULT 90,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_GuildConfig" ("createdAt", "dmReminderOffsetsMinutes", "guildId", "pingRoleId", "reminderChannelId", "roleReminderOffsetsMinutes", "upcomingEventsChannelId", "updatedAt") SELECT "createdAt", "dmReminderOffsetsMinutes", "guildId", "pingRoleId", "reminderChannelId", "roleReminderOffsetsMinutes", "upcomingEventsChannelId", "updatedAt" FROM "GuildConfig";
DROP TABLE "GuildConfig";
ALTER TABLE "new_GuildConfig" RENAME TO "GuildConfig";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
