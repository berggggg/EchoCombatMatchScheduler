import { Client, Events, GatewayIntentBits } from "discord.js";

import { autocompleteProviders } from "../autocomplete/index.js";
import { findButtonHandler } from "../buttons/index.js";
import { commandMap } from "../commands/index.js";
import { isDiscordUnknownMessageError } from "../util/discordErrors.js";

export const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

client.once(Events.ClientReady, (client) => {
  console.log(`Logged in as ${client.user.tag}`);
});

client.on(Events.InteractionCreate, async (interaction) => {
  try {
    if (interaction.isButton()) {
      const handler = findButtonHandler(interaction.customId);

      if (!handler) return;

      const eventId = interaction.customId.slice(handler.prefix.length);

      await handler.execute(interaction, eventId);
      return;
    }

    if (interaction.isAutocomplete()) {
      const focusedOption = interaction.options.getFocused(true);
      const provider = autocompleteProviders.get(focusedOption.name);

      if (!provider) {
        await interaction.respond([]);
        return;
      }

      await interaction.respond(await provider(String(focusedOption.value)));
      return;
    }

    if (!interaction.isChatInputCommand()) return;

    const command = commandMap.get(interaction.commandName);
    if (!command) return;

    await command.execute(interaction);
  } catch (error) {
    if (isDiscordUnknownMessageError(error)) {
      console.warn("Ignoring interaction for a message Discord no longer has.");
    } else {
      console.error(error);
    }

    try {
      if (interaction.isAutocomplete()) {
        await interaction.respond([]);
      } else if (interaction.replied || interaction.deferred) {
        await interaction.followUp({
          content: isDiscordUnknownMessageError(error)
            ? "That event message is no longer available. Please use the latest schedule message."
            : "An unexpected error occurred.",
          ephemeral: true
        });
      } else {
        await interaction.reply({
          content: isDiscordUnknownMessageError(error)
            ? "That event message is no longer available. Please use the latest schedule message."
            : "An unexpected error occurred.",
          ephemeral: true
        });
      }
    } catch (responseError) {
      console.error("Failed to send interaction error response:", responseError);
    }
  }
});
