import { ReminderType } from "@prisma/client";

import { prisma } from "../db/prisma.js";

export class EventRepository {
  async create(data: {
    guildId: string;
    title: string;
    startsAt: Date;
    creatorUserId: string;
    signupChannelId?: string;
    signupMessageId?: string;
  }) {
    return prisma.scheduledEvent.create({
      data,
    });
  }

  async getById(eventId: string) {
    return prisma.scheduledEvent.findUnique({
      where: { id: eventId },
      include: {
        signups: true,
        reminderLogs: true,
      },
    });
  }

  async getUpcoming(guildId: string, now = new Date()) {
    return prisma.scheduledEvent.findMany({
      where: {
        guildId,
        startsAt: {
          gt: now,
        },
      },
      include: {
        signups: true,
      },
      orderBy: {
        startsAt: "asc",
      },
    });
  }

  async delete(eventId: string) {
    return prisma.scheduledEvent.delete({
      where: { id: eventId },
    });
  }

  async addSignup(eventId: string, userId: string) {
    return prisma.scheduledSignup.upsert({
      where: {
        eventId_userId: {
          eventId,
          userId,
        },
      },
      create: {
        eventId,
        userId,
      },
      update: {},
    });
  }

  async removeSignup(eventId: string, userId: string) {
    return prisma.scheduledSignup.deleteMany({
      where: {
        eventId,
        userId,
      },
    });
  }

  async getSignupCount(eventId: string) {
    return prisma.scheduledSignup.count({
      where: { eventId },
    });
  }

  async createReminderLog(data: {
    eventId: string;
    offsetMinutes: number;
    type: ReminderType;
  }) {
    return prisma.reminderLog.create({
      data,
    });
  }
}