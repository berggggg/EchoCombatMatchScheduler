const fallbackTimeZones = [
  "UTC",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Berlin",
];

const supportedTimeZones = new Set(getSupportedTimeZones());

type IntlWithSupportedValues = typeof Intl & {
  supportedValuesOf?: (key: "timeZone") => string[];
};

export function isValidTimeZone(timeZone: string): boolean {
  return supportedTimeZones.has(timeZone);
}

export function getSupportedTimeZones(): string[] {
  const supportedValuesOf = (Intl as IntlWithSupportedValues).supportedValuesOf;

  if (supportedValuesOf) {
    return Array.from(new Set(["UTC", ...supportedValuesOf("timeZone")]));
  }

  return fallbackTimeZones;
}
