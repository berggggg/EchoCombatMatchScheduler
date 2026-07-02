import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";

import { pingCommand } from "./ping.js";

export interface Command {
    data: SlashCommandBuilder;
    execute(interaction: ChatInputCommandInteraction): Promise<void>;
}

export const commands: Command[] = [
    pingCommand,
];

export const commandMap = new Map<string, Command>(
    commands.map(command => [command.data.name, command]),
);
