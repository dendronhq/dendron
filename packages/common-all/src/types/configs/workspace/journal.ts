import { NoteAddBehaviorEnum } from "./types";

/**
 * Namespace for configuring journal note behavior
 */
export type JournalConfig = {
  dailyDomain: string;
  dailyVault?: string;
  name: string;
  dateFormat: string;
  addBehavior: NoteAddBehaviorEnum;
  // firstDayOfWeek: number;
};

// const assertion to tell the compiler that we only want these as dayOfWeekNumber.
const possibleDayOfWeekNumber = [0, 1, 2, 3, 4, 5, 6] as const;
export type dayOfWeekNumber = typeof possibleDayOfWeekNumber[number];

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
    // firstDayOfWeek: 1,
  };
}
