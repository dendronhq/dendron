import { DendronConfigEntry } from "../base";

/**
 * Enum definition of possible note add behavior values.
 */
export enum NoteAddBehaviorEnum {
  childOfDomain = "childOfDomain",
  childOfDomainNamespace = "childOfDomainNamespace",
  childOfCurrent = "childOfCurrent",
  asOwnDomain = "asOwnDomain",
}

/**
 * String literal type generated from {@link NoteAddBehaviorEnum}
 */
export type NoteAddBehavior = keyof typeof NoteAddBehaviorEnum;

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

/**
 * Constants for possible note add behaviors.
 * Each key of {@link NoteAddBehavior} is mapped to a {@link DendronConfigEntry}
 * which specifies the value, label, description of possible note add behaviors.
 *
 * These are used to generate user friendly descriptions in the configuration.
 */
const ADD_BEHAVIOR: {
  [key in NoteAddBehavior]: DendronConfigEntry<string>;
} = {
  childOfDomain: {
    value: "childOfDomain",
    label: "child of domain",
    desc: "Note is added as the child of domain of the current hierarchy",
  },
  childOfDomainNamespace: {
    value: "childOfDomainNamespace",
    label: "child of domain namespace",
    desc: "Note is added as child of the namespace of the current domain if it has a namespace. Otherwise added as child of domain.",
  },
  childOfCurrent: {
    value: "childOfCurrent",
    label: "child of current",
    desc: "Note is added as a child of the current open note",
  },
  asOwnDomain: {
    value: "asOwnDomain",
    label: "as own domain",
    desc: "Note is created under the domain specified by journal name value",
  },
};

// const assertion to tell the compiler that we only want these as dayOfWeekNymber.
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
