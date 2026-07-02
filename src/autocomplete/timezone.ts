import { getSupportedTimeZones } from "../util/timezones.js";

export interface AutocompleteChoice {
  name: string;
  value: string;
}

function scoreTimeZone(timeZone: string, input: string): number {
  const normalizedTimeZone = timeZone.toLowerCase();

  if (!input) return 3;
  if (normalizedTimeZone === input) return 0;
  if (normalizedTimeZone.startsWith(input)) return 1;
  if (normalizedTimeZone.split("/").some((part) => part.startsWith(input))) {
    return 2;
  }

  return 3;
}

export function timezoneAutocompleteProvider(input: string): AutocompleteChoice[] {
  const normalizedInput = input.trim().toLowerCase();

  return getSupportedTimeZones()
    .filter((timeZone) => timeZone.toLowerCase().includes(normalizedInput))
    .sort((left, right) => {
      const leftScore = scoreTimeZone(left, normalizedInput);
      const rightScore = scoreTimeZone(right, normalizedInput);

      if (leftScore !== rightScore) return leftScore - rightScore;

      return left.localeCompare(right);
    })
    .slice(0, 25)
    .map((timeZone) => ({
      name: timeZone,
      value: timeZone
    }));
}
