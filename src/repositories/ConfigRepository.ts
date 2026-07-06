import { prisma } from "../db/prisma.js";

export class ConfigRepository {
  async getByGuildId(guildId: string) {
    return prisma.guildConfig.findUnique({
      where: { guildId }
    });
  }

  async createDefault(guildId: string) {
    return prisma.guildConfig.create({
      data: { guildId }
    });
  }

  async upsert(
    guildId: string,
    data: {
      upcomingEventsChannelId?: string;
      reminderChannelId?: string;
      pingRoleId?: string;
      eventEmoji?: string;
      dmReminderOffsetsMinutes?: string;
      roleReminderOffsetsMinutes?: string;
      eventExpiryOffsetMinutes?: number;
    }
  ) {
    return prisma.guildConfig.upsert({
      where: { guildId },
      create: {
        guildId,
        ...data
      },
      update: data
    });
  }
}
