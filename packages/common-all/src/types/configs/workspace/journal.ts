import { DendronConfigEntry } from "../base";
import { NoteAddBehaviorEnum, ADD_BEHAVIOR } from "./types";

/**
 * Namespace for configuring journal note behavior
 */
export type JournalConfig = {
  dailyDomain: string;
  dailyVault?: string;
  name: string;
  dateFormat: string;
  addBehavior: NoteAddBehaviorEnum;
  firstDayOfWeek: number;
};

// const assertion to tell the compiler that we only want these as dayOfWeekNumber.
const possibleDayOfWeekNumber = [0, 1, 2, 3, 4, 5, 6] as const;
export type dayOfWeekNumber = typeof possibleDayOfWeekNumber[number];

/**
 * Given a {@link dayOfWeekNumber}, returns a {@link DendronConfigEntry} that holds
 * user friendly description of the first day of week behavior.
 *
 * @param value {@link dayOfWeekNumber}
 * @returns DendronConfigEntry
 */
const FIRST_DAY_OF_WEEK = (
  value: dayOfWeekNumber
): DendronConfigEntry<dayOfWeekNumber> => {
  const dayOfWeek = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  const valueToDay = dayOfWeek[value];
  return {
    label: valueToDay,
    desc: `Set start of the week to ${valueToDay}`,
  };
};

/**
 * Constants / functions that produce constants for possible journal configurations.
 * config entries that doesn't have limited choices have their values omitted.
 * config entries that have specific choices have their choices predefined or generated.
 */
export const JOURNAL = {
  DAILY_DOMAIN: {
    label: "daily domain",
    desc: "Domain where the journal notes are created",
  },
  NAME: {
    label: "journal name",
    desc: "Name used for journal notes",
  },
  DATE_FORMAT: {
    label: "date format",
    desc: "Date format used for journal notes",
  },
  ADD_BEHAVIOR,
  FIRST_DAY_OF_WEEK,
};

/**
 * Generates default {@link JournalConfig}
 * @returns JouranlConfig
 */
export function genDefaultJournalConfig(): JournalConfig {
  return {
    dailyDomain: "daily",
    name: "journal",
    dateFormat: "y.MM.dd",
    addBehavior: NoteAddBehaviorEnum.childOfDomain,
    firstDayOfWeek: 1,
  };
}
