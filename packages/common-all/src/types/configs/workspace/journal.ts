import { DendronConfigEntry } from "../base";

export enum NoteAddBehaviorEnum {
  childOfDomain = "childOfDomain",
  childOfDomainNamespace = "childOfDomainNamespace",
  childOfCurrent = "childOfCurrent",
  asOwnDomain = "asOwnDomain",
}

export type NoteAddBehavior = keyof typeof NoteAddBehaviorEnum;

export type JournalConfig = {
  dailyDomain: string;
  dailyVault?: string;
  name: string;
  dateFormat: string;
  addBehavior: NoteAddBehaviorEnum;
  firstDayOfWeek: number;
};

export const JOURNAL_DAILY_DOMAIN: DendronConfigEntry<string> = {
  label: "daily domain",
  desc: "Domain where the journal notes are created",
};

export const JOURNAL_NAME: DendronConfigEntry<string> = {
  label: "journal name",
  desc: "Name used for journal notes",
};

export const JOURNAL_DATE_FORMAT: DendronConfigEntry<string> = {
  label: "date format",
  desc: "Date format used for journal notes",
};

export const JOURNAL_ADD_BEHAVIOR: {
  [key: string]: DendronConfigEntry<string>;
} = {
  CHILD_OF_DOMAIN: {
    value: "childOfDomain",
    label: "child of domain",
    desc: "Note is added as the child of domain of the current hierarchy",
  },
  CHILD_OF_DOMAIN_NAMESPACE: {
    value: "childOfDomainNamespace",
    label: "child of domain namespace",
    desc: "Note is added as child of the namespace of the current domain if it has a namespace. Otherwise added as child of domain.",
  },
  CHILD_OF_CURRENT: {
    value: "childOfCurrent",
    label: "child of current",
    desc: "Note is added as a child of the current open note",
  },
  AS_OWN_DOMAIN: {
    value: "asOwnDomain",
    label: "as own domain",
    desc: "Note is created under the domain specified by journal name value",
  },
};

export const JOURNAL_FIRST_DAY_OF_WEEK = (
  value: number
): DendronConfigEntry<number> => {
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

export function genDefaultJournalConfig(): JournalConfig {
  return {
    dailyDomain: "daily",
    name: "journal",
    dateFormat: "y.MM.dd",
    addBehavior: NoteAddBehaviorEnum.childOfDomain,
    firstDayOfWeek: 1,
  };
}
