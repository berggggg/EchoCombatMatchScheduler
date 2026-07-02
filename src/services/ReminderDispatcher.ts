import type { GuildConfig, ReminderLog, ScheduledEvent, ScheduledSignup } from "@prisma/client";
import { ReminderType } from "@prisma/client";
import type { Client, Guild, SendableChannels } from "discord.js";

import { toDiscordUnixTimestamp } from "../util/dateTime.js";

export type ReminderWorkItem = {
  event: ScheduledEvent & {
    signups: ScheduledSignup[];
    reminderLogs: ReminderLog[];
  };
  offsetMinutes: number;
  type: ReminderLog["type"];
};

export class ReminderDispatcher {
  async dispatch(client: Client, workItem: ReminderWorkItem, config: GuildConfig): Promise<void> {
    console.log(
      `[ReminderDispatcher] ${workItem.type} reminder due: eventId=${workItem.event.id}, guildId=${workItem.event.guildId}, offsetMinutes=${workItem.offsetMinutes}, startsAt=${workItem.event.startsAt.toISOString()}`
    );

    if (workItem.type === ReminderType.DM) {
      await this.dispatchDmReminder(client, workItem);
      return;
    }

    await this.dispatchRoleReminder(client, workItem, config);
  }

  private async dispatchDmReminder(client: Client, workItem: ReminderWorkItem): Promise<void> {
    const playerNames = await this.getPlayerNames(client, workItem.event.signups);
    const content = this.buildReminderContent(workItem, playerNames);

    await Promise.all(
      workItem.event.signups.map(async (signup) => {
        try {
          const user = await client.users.fetch(signup.userId);
          await user.send({ content });
        } catch (error) {
          console.error(
            `[ReminderDispatcher] Failed to DM userId=${signup.userId} for eventId=${workItem.event.id}:`,
            error
          );
        }
      })
    );
  }

  private async dispatchRoleReminder(
    client: Client,
    workItem: ReminderWorkItem,
    config: GuildConfig
  ): Promise<void> {
    if (!config.reminderChannelId) {
      throw new Error(
        `Cannot send role reminder for guildId=${workItem.event.guildId}: reminder channel is not configured.`
      );
    }

    if (!config.pingRoleId) {
      throw new Error(
        `Cannot send role reminder for guildId=${workItem.event.guildId}: ping role is not configured.`
      );
    }

    const channel = await client.channels.fetch(config.reminderChannelId);

    if (!channel || !channel.isTextBased() || !channel.isSendable()) {
      throw new Error(
        `Cannot send role reminder for guildId=${workItem.event.guildId}: reminder channel is unavailable or not sendable.`
      );
    }

    const guild = await client.guilds.fetch(workItem.event.guildId);
    const individualMentionUserIds = await this.getSignedUpUsersWithoutRole(
      guild,
      workItem.event.signups,
      config.pingRoleId
    );
    const playerNames = await this.getPlayerNames(client, workItem.event.signups);
    const mentions = [
      `<@&${config.pingRoleId}>`,
      ...individualMentionUserIds.map((userId) => `<@${userId}>`)
    ].join(" ");

    await (channel as SendableChannels).send({
      content: `${this.buildReminderContent(workItem, playerNames)}\n\n${mentions}`,
      allowedMentions: {
        parse: [],
        roles: [config.pingRoleId],
        users: individualMentionUserIds
      }
    });
  }

  private async getSignedUpUsersWithoutRole(
    guild: Guild,
    signups: ScheduledSignup[],
    roleId: string
  ): Promise<string[]> {
    const userIds: string[] = [];

    for (const signup of signups) {
      try {
        const member = await guild.members.fetch(signup.userId);

        if (!member.roles.cache.has(roleId)) {
          userIds.push(signup.userId);
        }
      } catch (error) {
        console.error(
          `[ReminderDispatcher] Failed to fetch member userId=${signup.userId} in guildId=${guild.id}; including individual mention:`,
          error
        );
        userIds.push(signup.userId);
      }
    }

    return userIds;
  }

  private async getPlayerNames(client: Client, signups: ScheduledSignup[]): Promise<string[]> {
    return Promise.all(
      signups.map(async (signup) => {
        try {
          const user = await client.users.fetch(signup.userId);

          return user.username;
        } catch {
          return `<@${signup.userId}>`;
        }
      })
    );
  }

  private buildReminderContent(workItem: ReminderWorkItem, playerNames: string[]): string {
    const unix = toDiscordUnixTimestamp(workItem.event.startsAt);
    const playerList =
      playerNames.length > 0
        ? playerNames.map((name) => `- ${name}`).join("\n")
        : "No players signed up.";

    return (
      `# Echo Combat Games Reminder!\n` +
      `## **${workItem.event.title}** starts at <t:${unix}:F> (<t:${unix}:R>).\n\n` +
      `Players (${workItem.event.signups.length}):\n` +
      playerList
    );
  }
}

export const reminderDispatcher = new ReminderDispatcher();
