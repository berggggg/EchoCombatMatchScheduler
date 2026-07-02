export const DISCORD_UNKNOWN_MESSAGE_CODE = 10008;

export function isDiscordErrorCode(error: unknown, code: number) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    Number((error as { code: unknown }).code) === code
  );
}

export function isDiscordUnknownMessageError(error: unknown) {
  return isDiscordErrorCode(error, DISCORD_UNKNOWN_MESSAGE_CODE);
}
