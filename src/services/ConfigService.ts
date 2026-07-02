import { GuildConfig } from "@prisma/client";

import { ConfigRepository } from "../repositories/ConfigRepository.js";

export interface UpdateGuildConfigInput {
  guildId: string;
  upcomingEventsChannelId?: string;
  reminderChannelId?: string;
  pingRoleId?: string;
  reminderOffsetsMinutes?: number[];
}

export class ConfigService {
  constructor(
    private readonly configRepository = new ConfigRepository(),
  ) {}

  async getConfig(guildId: string): Promise<GuildConfig | null> {
    return this.configRepository.getByGuildId(guildId);
  }

  async updateConfig(input: UpdateGuildConfigInput): Promise<GuildConfig> {
    const { guildId, reminderOffsetsMinutes, ...data } = input;

    return this.configRepository.upsert(guildId, {
      ...data,
      ...(reminderOffsetsMinutes
        ? { reminderOffsetsMinutes: JSON.stringify(reminderOffsetsMinutes) }
        : {}),
    });
  }

  parseReminderOffsets(input: string): number[] {
    const offsets = input
      .split(",")
      .map((value) => Number.parseInt(value.trim(), 10));

    if (
      offsets.length === 0 ||
      offsets.some((value) => !Number.isInteger(value) || value <= 0)
    ) {
      throw new Error("Reminder offsets must be positive integers separated by commas.");
    }

    return offsets;
  }
}

export const configService = new ConfigService();
