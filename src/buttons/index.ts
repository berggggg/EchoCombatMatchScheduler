import { ButtonInteraction } from "discord.js";

import { handleEventJoinButton, handleEventLeaveButton } from "./eventButtons.js";

export interface ButtonHandler {
  prefix: string;
  execute(interaction: ButtonInteraction, eventId: string): Promise<void>;
}

export const buttonHandlers: ButtonHandler[] = [
  {
    prefix: "event_join:",
    execute: handleEventJoinButton
  },
  {
    prefix: "event_leave:",
    execute: handleEventLeaveButton
  }
];

export function findButtonHandler(customId: string) {
  return buttonHandlers.find((handler) => customId.startsWith(handler.prefix));
}
