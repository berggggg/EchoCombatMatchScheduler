import {
  ChannelType,
  ChatInputCommandInteraction,
  SlashCommandBuilder,
} from "discord.js";

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
        .setRequired(false),
    )
    .addChannelOption((option) =>
      option
        .setName("reminder_channel")
        .setDescription("Channel used for role reminder pings.")
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(false),
    )
    .addRoleOption((option) =>
      option
        .setName("ping_role")
        .setDescription("Role to ping for scheduled event reminders.")
        .setRequired(false),
    )
    .addStringOption((option) =>
      option
        .setName("reminder_offsets")
        .setDescription("Reminder offsets in minutes, e.g. 720,60.")
        .setRequired(false),
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.guildId) {
      await interaction.reply({
        content: "This command can only be used in a server.",
        ephemeral: true,
      });
      return;
    }

    const upcomingChannel = interaction.options.getChannel("upcoming_channel");
    const reminderChannel = interaction.options.getChannel("reminder_channel");
    const pingRole = interaction.options.getRole("ping_role");
    const reminderOffsetsInput = interaction.options.getString("reminder_offsets");

    const hasUpdates =
        upcomingChannel ||
        reminderChannel ||
        pingRole ||
        reminderOffsetsInput;

    if (!hasUpdates) {
        const config = await configService.getConfig(interaction.guildId);

        await interaction.reply({
            content:
            `Scheduler Configuration\n\n` +
            `Upcoming events channel: ${config?.upcomingEventsChannelId ? `<#${config.upcomingEventsChannelId}>` : "not set"}\n` +
            `Reminder channel: ${config?.reminderChannelId ? `<#${config.reminderChannelId}>` : "not set"}\n` +
            `Ping role: ${config?.pingRoleId ? `<@&${config.pingRoleId}>` : "not set"}\n` +
            `Reminder offsets: ${config?.reminderOffsetsMinutes ?? "[720,60]"}`,
            ephemeral: true,
    });

    return;
    }

    let reminderOffsetsMinutes: number[] | undefined;

    try {
      reminderOffsetsMinutes = reminderOffsetsInput
        ? configService.parseReminderOffsets(reminderOffsetsInput)
        : undefined;
    } catch (error) {
      await interaction.reply({
        content: error instanceof Error ? error.message : "Invalid reminder offsets.",
        ephemeral: true,
      });
      return;
    }

    const config = await configService.updateConfig({
      guildId: interaction.guildId,
      upcomingEventsChannelId: upcomingChannel?.id,
      reminderChannelId: reminderChannel?.id,
      pingRoleId: pingRole?.id,
      reminderOffsetsMinutes,
    });

    await interaction.reply({
      content:
        `Updated scheduler config.\n` +
        `Upcoming events channel: ${config.upcomingEventsChannelId ? `<#${config.upcomingEventsChannelId}>` : "not set"}\n` +
        `Reminder channel: ${config.reminderChannelId ? `<#${config.reminderChannelId}>` : "not set"}\n` +
        `Ping role: ${config.pingRoleId ? `<@&${config.pingRoleId}>` : "not set"}\n` +
        `Reminder offsets: ${config.reminderOffsetsMinutes}`,
      ephemeral: true,
    });
  },
};
