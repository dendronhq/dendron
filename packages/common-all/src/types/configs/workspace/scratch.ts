import { JournalConfig } from "./journal";
import { NoteAddBehaviorEnum } from "./types";

/**
 * Namespace for configuring scratch note behavior
 */
export type ScratchConfig = Pick<
  JournalConfig,
  "name" | "dateFormat" | "addBehavior"
>;

/**
 * Generates default {@link ScratchConfig}
 * @returns ScratchConfig
 */
export function genDefaultScratchConfig(): ScratchConfig {
  return {
    name: "scratch",
    dateFormat: "y.MM.dd.HHmmss",
    addBehavior: NoteAddBehaviorEnum.asOwnDomain,
  };
}
