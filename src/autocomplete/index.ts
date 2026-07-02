import type { AutocompleteChoice } from "./timezone.js";
import { timezoneAutocompleteProvider } from "./timezone.js";

export type AutocompleteProvider = (
  input: string,
) => AutocompleteChoice[] | Promise<AutocompleteChoice[]>;

export const autocompleteProviders = new Map<string, AutocompleteProvider>([
  ["timezone", timezoneAutocompleteProvider],
]);
