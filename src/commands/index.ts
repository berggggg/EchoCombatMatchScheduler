import {
  ChatInputCommandInteraction,
  SlashCommandOptionsOnlyBuilder,
} from "discord.js";

import { pingCommand } from "./ping.js";
import { configCommand } from "./config.js";
import { scheduleCommand } from "./schedule.js";
import { eventsCommand } from "./events.js";

export interface Command {
    data: SlashCommandOptionsOnlyBuilder;
    execute(interaction: ChatInputCommandInteraction): Promise<void>;
}

export const commands: Command[] = [
    pingCommand,
    configCommand,
    scheduleCommand,
    eventsCommand,
];

export const commandMap = new Map<string, Command>(
    commands.map(command => [command.data.name, command]),
);
