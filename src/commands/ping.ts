import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";

import type { Command } from "./index.js";

export const pingCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Checks whether the bot is responding by replying with Pong."),

  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.reply("Pong.");
  }
};
