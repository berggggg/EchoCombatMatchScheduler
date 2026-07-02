import { ButtonInteraction } from "discord.js";

import { eventService } from "../services/EventService.js";

export async function handleEventJoinButton(
  interaction: ButtonInteraction,
  eventId: string,
) {
  await interaction.deferUpdate();

  try {
    await eventService.joinEvent(eventId, interaction.user.id);
  } catch (error) {
    await interaction.followUp({
      content:
        error instanceof Error ? error.message : "This event no longer exists.",
      ephemeral: true,
    });
  }
}

export async function handleEventLeaveButton(
  interaction: ButtonInteraction,
  eventId: string,
) {
  await interaction.deferUpdate();

  try {
    const result = await eventService.leaveEvent(eventId, interaction.user.id);

    if (result.deleted) {
      await interaction.followUp({
        content:
          "You left the event. Since no players remain signed up, the event was deleted.",
        ephemeral: true,
      });
    }
  } catch (error) {
    await interaction.followUp({
      content:
        error instanceof Error ? error.message : "This event no longer exists.",
      ephemeral: true,
    });
  }
}