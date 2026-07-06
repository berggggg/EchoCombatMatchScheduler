import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";

import type { Command } from "./index.js";
import { configService } from "../services/ConfigService.js";
import { eventService } from "../services/EventService.js";
import { toDiscordUnixTimestamp } from "../util/dateTime.js";

export const eventsCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("events")
    .setDescription("Show upcoming scheduled events."),

  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.guildId) {
      await interaction.reply({
        content: "This command can only be used in a server.",
        ephemeral: true
      });
      return;
    }

    const events = await eventService.getUpcomingEvents(interaction.guildId);
    const config = await configService.getOrCreateConfig(interaction.guildId);
    const eventEmoji = config.eventEmoji ?? "<:echothinking:1523785136632496168>";

    if (events.length === 0) {
      await interaction.reply({
        content: "No upcoming events are currently scheduled.",
        ephemeral: true
      });
      return;
    }

    const eventLines = events.map((event, index) => {
      const unix = toDiscordUnixTimestamp(event.startsAt);

      const signupList =
        event.signups.length > 0
          ? event.signups.map((signup) => `<@${signup.userId}>`).join(", ")
          : "No players signed up.";

      return (
        `~~--------------------------------------------------~~\n` +
        `## **${index + 1}. ${eventEmoji} ${event.title}**\n` +
        `🕒 <t:${unix}:F>\n` +
        `⏳ *<t:${unix}:R>*\n\n` +
        `Players (${event.signups.length}):\n` +
        "- " +
        `${signupList}`
      );
    });

    await interaction.reply({
      content: `# **Upcoming Events**\n${eventLines.join("\n\n")}`,
      allowedMentions: { parse: [] },
      ephemeral: true
    });
  }
};
