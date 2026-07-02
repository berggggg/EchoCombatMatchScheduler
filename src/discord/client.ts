import { Client, Events, GatewayIntentBits } from "discord.js";

import { commandMap } from "../commands/index.js";

export const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
    ],
});

client.once(Events.ClientReady, (client) => {
    console.log(`Logged in as ${client.user.tag}`);
});

client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    const command = commandMap.get(interaction.commandName);
    if (!command) return;

    try {
      await command.execute(interaction);
    }
    catch (error) {
      console.error(error);

      if (interaction.replied || interaction.deferred) {
          await interaction.followUp({
              content: "An unexpected error occurred.",
              ephemeral: true,
          });
      }
      else {
          await interaction.reply({
              content: "An unexpected error occurred.",
              ephemeral: true,
          });
      }
    }
});
