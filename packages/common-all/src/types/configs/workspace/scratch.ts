import { JournalConfig } from "./journal";
import { ADD_BEHAVIOR, NoteAddBehaviorEnum } from "./types";

/**
 * Namespace for configuring scratch note behavior
 */
export type ScratchConfig = Pick<
  JournalConfig,
  "name" | "dateFormat" | "addBehavior"
>;

/**
 * Constants / functions that produce constants for possible journal configurations.
 * config entries that doesn't have limited choices have their values omitted.
 * config entries that have specific choices have their choices predefined or generated.
 */
export const SCRATCH = {
  NAME: {
    label: "scratch name",
    desc: "Name used for scratch notes",
  },
  DATE_FORMAT: {
    label: "date format",
    desc: "Date format used for scratch notes",
  },
  ADD_BEHAVIOR,
};

export function genDefaultScratcnConfig(): ScratchConfig {
  return {
    name: "scratch",
    dateFormat: "y.MM.dd.HHmmss",
    addBehavior: NoteAddBehaviorEnum.asOwnDomain,
  };
}
