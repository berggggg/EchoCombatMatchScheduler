import { ChannelType, ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";

import type { Command } from "./index.js";
import { configService } from "../services/ConfigService.js";

export const configCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("config")
    .setDescription("Configure scheduler settings for this server.")
    .addChannelOption((option) =>
      option
        .setName("upcoming_channel")
        .setDescription("Channel used for the upcoming events board.")
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(false)
    )
    .addChannelOption((option) =>
      option
        .setName("reminder_channel")
        .setDescription("Channel used for role reminder pings.")
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(false)
    )
    .addRoleOption((option) =>
      option
        .setName("ping_role")
        .setDescription("Role to ping for scheduled event reminders.")
        .setRequired(false)
    )
    .addStringOption((option) =>
      option
        .setName("dm_reminder_offsets")
        .setDescription("DM reminder offsets in minutes, e.g. 720,60.")
        .setRequired(false)
    )
    .addStringOption((option) =>
      option
        .setName("role_reminder_offsets")
        .setDescription("Role ping reminder offsets in minutes, e.g. 60,15.")
        .setRequired(false)
    )
    .addIntegerOption((option) =>
      option
        .setName("event_expiry_offset")
        .setDescription("Minutes after start time before an event is removed.")
        .setMinValue(1)
        .setRequired(false)
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.guildId) {
      await interaction.reply({
        content: "This command can only be used in a server.",
        ephemeral: true
      });
      return;
    }

    const upcomingChannel = interaction.options.getChannel("upcoming_channel");
    const reminderChannel = interaction.options.getChannel("reminder_channel");
    const pingRole = interaction.options.getRole("ping_role");
    const dmReminderOffsets = interaction.options.getString("dm_reminder_offsets");
    const roleReminderOffsets = interaction.options.getString("role_reminder_offsets");
    const eventExpiryOffset = interaction.options.getInteger("event_expiry_offset");

    const hasUpdates =
      upcomingChannel ||
      reminderChannel ||
      pingRole ||
      dmReminderOffsets ||
      roleReminderOffsets ||
      eventExpiryOffset !== null;

    if (!hasUpdates) {
      const config = await configService.getOrCreateConfig(interaction.guildId);
      const dmOffsets = configService.getDmReminderOffsets(config).join(", ");
      const roleOffsets = configService.getRoleReminderOffsets(config).join(", ");

      await interaction.reply({
        content:
          `Scheduler Configuration\n\n` +
          `Upcoming events channel: ${config.upcomingEventsChannelId ? `<#${config.upcomingEventsChannelId}>` : "not set"}\n` +
          `Reminder channel: ${config.reminderChannelId ? `<#${config.reminderChannelId}>` : "not set"}\n` +
          `Ping role: ${config.pingRoleId ? `<@&${config.pingRoleId}>` : "not set"}\n` +
          `DM reminder offsets: ${dmOffsets}\n` +
          `Role ping reminder offsets: ${roleOffsets}\n` +
          `Event expiry offset: ${config.eventExpiryOffsetMinutes} minutes`,
        ephemeral: true
      });

      return;
    }

    let dmReminderOffsetsMinutes: number[] | undefined;
    let roleReminderOffsetsMinutes: number[] | undefined;
    let eventExpiryOffsetMinutes: number | undefined;

    try {
      dmReminderOffsetsMinutes = dmReminderOffsets
        ? configService.parseReminderOffsets(dmReminderOffsets)
        : undefined;

      roleReminderOffsetsMinutes = roleReminderOffsets
        ? configService.parseReminderOffsets(roleReminderOffsets)
        : undefined;

      eventExpiryOffsetMinutes = configService.parsePositiveInteger(
        eventExpiryOffset,
        "Event expiry offset"
      );
    } catch (error) {
      await interaction.reply({
        content: error instanceof Error ? error.message : "Invalid config value.",
        ephemeral: true
      });
      return;
    }

    const config = await configService.updateConfig({
      guildId: interaction.guildId,
      upcomingEventsChannelId: upcomingChannel?.id,
      reminderChannelId: reminderChannel?.id,
      pingRoleId: pingRole?.id,
      dmReminderOffsetsMinutes,
      roleReminderOffsetsMinutes,
      eventExpiryOffsetMinutes
    });

    await interaction.reply({
      content:
        `Updated scheduler config.\n` +
        `Upcoming events channel: ${config.upcomingEventsChannelId ? `<#${config.upcomingEventsChannelId}>` : "not set"}\n` +
        `Reminder channel: ${config.reminderChannelId ? `<#${config.reminderChannelId}>` : "not set"}\n` +
        `Ping role: ${config.pingRoleId ? `<@&${config.pingRoleId}>` : "not set"}\n` +
        `DM reminder offsets: ${configService.getDmReminderOffsets(config).join(", ")}\n` +
        `Role reminder offsets: ${configService.getRoleReminderOffsets(config).join(", ")}\n` +
        `Event expiry offset: ${config.eventExpiryOffsetMinutes} minutes`,
      ephemeral: true
    });
  }
};
