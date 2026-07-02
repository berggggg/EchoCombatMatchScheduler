import {
  ChatInputCommandInteraction,
  SlashCommandOptionsOnlyBuilder,
} from "discord.js";

import { pingCommand } from "./ping.js";
import { configCommand } from "./config.js";

export interface Command {
    data: SlashCommandOptionsOnlyBuilder;
    execute(interaction: ChatInputCommandInteraction): Promise<void>;
}

export const commands: Command[] = [
    pingCommand,
    configCommand,
];

export const commandMap = new Map<string, Command>(
    commands.map(command => [command.data.name, command]),
);
