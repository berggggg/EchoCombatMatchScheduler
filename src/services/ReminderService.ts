import { ReminderType } from "@prisma/client";
import type { Client } from "discord.js";

import { ConfigRepository } from "../repositories/ConfigRepository.js";
import { EventRepository } from "../repositories/EventRepository.js";
import { configService } from "./ConfigService.js";
import {
  reminderDispatcher,
  type ReminderDispatcher,
  type ReminderWorkItem
} from "./ReminderDispatcher.js";
import { scheduleBoardService, type BoardMessageRef } from "./ScheduleBoardService.js";

const REMINDER_TICK_INTERVAL_MS = 60_000;

export class ReminderService {
  private interval: NodeJS.Timeout | null = null;

  constructor(
    private readonly eventRepository = new EventRepository(),
    private readonly configRepository = new ConfigRepository(),
    private readonly dispatcher: ReminderDispatcher = reminderDispatcher
  ) {}

  start(client: Client): void {
    if (this.interval) return;

    this.runTick(client);
    this.interval = setInterval(() => {
      this.runTick(client);
    }, REMINDER_TICK_INTERVAL_MS);

    console.log("[ReminderService] Started reminder scheduler.");
  }

  stop(): void {
    if (!this.interval) return;

    clearInterval(this.interval);
    this.interval = null;
    console.log("[ReminderService] Stopped reminder scheduler.");
  }

  async tick(client: Client): Promise<void> {
    const now = new Date();
    const events = await this.eventRepository.getAllUpcomingForReminders(now);

    for (const event of events) {
      const config = await this.configRepository.getByGuildId(event.guildId);

      if (!config) continue;

      const workItems: ReminderWorkItem[] = [
        ...this.getDueWorkItems({
          event,
          offsets: configService.getDmReminderOffsets(config),
          type: ReminderType.DM,
          now
        }),
        ...this.getDueWorkItems({
          event,
          offsets: configService.getRoleReminderOffsets(config),
          type: ReminderType.ROLE_PING,
          now
        })
      ];

      for (const workItem of workItems) {
        const alreadyLogged = await this.eventRepository.reminderLogExists({
          eventId: workItem.event.id,
          offsetMinutes: workItem.offsetMinutes,
          type: workItem.type
        });

        if (alreadyLogged) continue;

        try {
          await this.dispatcher.dispatch(client, workItem, config);
          await this.eventRepository.createReminderLog({
            eventId: workItem.event.id,
            offsetMinutes: workItem.offsetMinutes,
            type: workItem.type
          });
        } catch (error) {
          console.error(
            `[ReminderService] Failed to dispatch ${workItem.type} reminder for eventId=${workItem.event.id}, offsetMinutes=${workItem.offsetMinutes}:`,
            error
          );
        }
      }
    }

    await this.cleanupExpiredEvents(client, now);
  }

  private getDueWorkItems(input: {
    event: ReminderWorkItem["event"];
    offsets: number[];
    type: ReminderType;
    now: Date;
  }): ReminderWorkItem[] {
    return input.offsets
      .filter((offsetMinutes) =>
        this.isReminderDue({
          eventStartsAt: input.event.startsAt,
          offsetMinutes,
          now: input.now
        })
      )
      .filter(
        (offsetMinutes) =>
          !input.event.reminderLogs.some(
            (log) => log.offsetMinutes === offsetMinutes && log.type === input.type
          )
      )
      .map((offsetMinutes) => ({
        event: input.event,
        offsetMinutes,
        type: input.type
      }));
  }

  private isReminderDue(input: { eventStartsAt: Date; offsetMinutes: number; now: Date }): boolean {
    const reminderDueAt = new Date(input.eventStartsAt.getTime() - input.offsetMinutes * 60_000);

    return input.now >= reminderDueAt && input.now < input.eventStartsAt;
  }

  private runTick(client: Client): void {
    void this.tick(client).catch((error) => {
      console.error("[ReminderService] Reminder tick failed:", error);
    });
  }

  private async cleanupExpiredEvents(client: Client, now: Date): Promise<void> {
    const events = await this.eventRepository.getStartedForExpiryCleanup(now);
    const staleMessageRefsByGuildId = new Map<string, BoardMessageRef[]>();

    for (const event of events) {
      const config = await this.configRepository.getByGuildId(event.guildId);
      const expiryOffsetMinutes = config?.eventExpiryOffsetMinutes ?? 90;
      const expiresAt = new Date(event.startsAt.getTime() + expiryOffsetMinutes * 60_000);

      if (now < expiresAt) {
        continue;
      }

      try {
        if (event.signupChannelId && event.signupMessageId) {
          await this.deleteEventBoardMessage(client, {
            channelId: event.signupChannelId,
            messageId: event.signupMessageId
          });

          const staleRefs = staleMessageRefsByGuildId.get(event.guildId) ?? [];
          staleRefs.push({
            channelId: event.signupChannelId,
            messageId: event.signupMessageId
          });
          staleMessageRefsByGuildId.set(event.guildId, staleRefs);
        }

        await this.eventRepository.delete(event.id);
        if (!staleMessageRefsByGuildId.has(event.guildId)) {
          staleMessageRefsByGuildId.set(event.guildId, []);
        }
        console.log(
          `[ReminderService] Deleted expired eventId=${event.id}, guildId=${event.guildId}, startsAt=${event.startsAt.toISOString()}, expiryOffsetMinutes=${expiryOffsetMinutes}`
        );
      } catch (error) {
        console.error(`[ReminderService] Failed to clean up expired eventId=${event.id}:`, error);
      }
    }

    for (const [guildId, staleMessageRefs] of staleMessageRefsByGuildId) {
      try {
        await scheduleBoardService.refresh(client, guildId, staleMessageRefs);
      } catch (error) {
        console.error(
          `[ReminderService] Failed to refresh schedule board after expiry cleanup for guildId=${guildId}:`,
          error
        );
      }
    }
  }

  private async deleteEventBoardMessage(
    client: Client,
    messageRef: BoardMessageRef
  ): Promise<void> {
    try {
      const channel = await client.channels.fetch(messageRef.channelId);

      if (!channel || !channel.isTextBased()) {
        return;
      }

      const message = await channel.messages.fetch(messageRef.messageId);

      if (message.author.id === client.user?.id) {
        await message.delete();
      }
    } catch {
      // Already deleted or inaccessible is acceptable during expiry cleanup.
    }
  }
}

export const reminderService = new ReminderService();
