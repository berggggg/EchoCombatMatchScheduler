import { GuildConfig } from "@prisma/client";

import { ConfigRepository } from "../repositories/ConfigRepository.js";

export interface UpdateGuildConfigInput {
  guildId: string;
  upcomingEventsChannelId?: string;
  reminderChannelId?: string;
  pingRoleId?: string;
  eventEmoji?: string;
  dmReminderOffsetsMinutes?: number[];
  roleReminderOffsetsMinutes?: number[];
  eventExpiryOffsetMinutes?: number;
}

export class ConfigService {
  constructor(private readonly configRepository = new ConfigRepository()) {}

  async getConfig(guildId: string): Promise<GuildConfig | null> {
    return this.configRepository.getByGuildId(guildId);
  }

  async getOrCreateConfig(guildId: string): Promise<GuildConfig> {
    const config = await this.configRepository.getByGuildId(guildId);

    return config ?? this.configRepository.createDefault(guildId);
  }

  async updateConfig(input: UpdateGuildConfigInput): Promise<GuildConfig> {
    const {
      guildId,
      dmReminderOffsetsMinutes,
      roleReminderOffsetsMinutes,
      eventExpiryOffsetMinutes,
      ...data
    } = input;

    return this.configRepository.upsert(guildId, {
      ...data,
      ...(eventExpiryOffsetMinutes !== undefined ? { eventExpiryOffsetMinutes } : {}),
      ...(dmReminderOffsetsMinutes !== undefined
        ? { dmReminderOffsetsMinutes: JSON.stringify(dmReminderOffsetsMinutes) }
        : {}),
      ...(roleReminderOffsetsMinutes !== undefined
        ? { roleReminderOffsetsMinutes: JSON.stringify(roleReminderOffsetsMinutes) }
        : {})
    });
  }

  parseReminderOffsets(input: string): number[] {
    const offsets = input.split(",").map((value) => Number.parseInt(value.trim(), 10));

    if (offsets.length === 0 || offsets.some((value) => !Number.isInteger(value) || value <= 0)) {
      throw new Error("Reminder offsets must be positive integers separated by commas.");
    }

    return offsets;
  }

  parsePositiveInteger(input: number | null, fieldName: string): number | undefined {
    if (input === null) {
      return undefined;
    }

    if (!Number.isInteger(input) || input <= 0) {
      throw new Error(`${fieldName} must be a positive integer.`);
    }

    return input;
  }

  parseEmoji(input: string | null): string | undefined {
    if (input === null) {
      return undefined;
    }

    const emoji = input.trim();

    if (!emoji || emoji.includes("\n") || emoji.length > 100) {
      throw new Error("Event emoji must be a non-empty single-line value up to 100 characters.");
    }

    return emoji;
  }

  getDmReminderOffsets(config: { dmReminderOffsetsMinutes: string }): number[] {
    return JSON.parse(config.dmReminderOffsetsMinutes) as number[];
  }

  getRoleReminderOffsets(config: { roleReminderOffsetsMinutes: string }): number[] {
    return JSON.parse(config.roleReminderOffsetsMinutes) as number[];
  }
}

export const configService = new ConfigService();
