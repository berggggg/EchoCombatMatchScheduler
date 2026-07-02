import { prisma } from "../db/prisma.js";

export class ConfigRepository {
    async getByGuildId(guildId: string) {
        return prisma.guildConfig.findUnique({
        where: { guildId },
        });
    }

    async upsert(guildId: string, data: {
        upcomingEventsChannelId?: string;
        reminderChannelId?: string;
        pingRoleId?: string;
        reminderOffsetsMinutes?: string;
        dmReminderTemplate?: string;
        roleReminderTemplate?: string;
    }) {
        return prisma.guildConfig.upsert({
            where: { guildId },
            create: {
                guildId,
                ...data,
            },
            update: data,
        });
    }
}
