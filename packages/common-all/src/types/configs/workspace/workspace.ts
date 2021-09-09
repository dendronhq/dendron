import { DendronConfigEntry } from "../base";
import { genDefaultJournalConfig, JournalConfig, JOURNAL } from "./journal";
import { genDefaultScratcnConfig, ScratchConfig, SCRATCH } from "./scratch";

/**
 * Namespace for configurations that affect the workspace
 */
export type DendronWorkspaceConfig = {
  noTelemetry?: boolean;
  journal: JournalConfig;
  scratch: ScratchConfig;
};

/**
 * Given a boolean value, returns a {@link DendronConfigEntry} that holds
 * user friendly description of the noTelemetry configuration.
 *
 * @param value booelan
 * @returns DendronConfigEntry
 */
export const NO_TELEMETRY = (value: boolean): DendronConfigEntry<boolean> => {
  const valueToString = value ? "Disable" : "Enable";
  return {
    label: `${valueToString} telemetry`,
    desc: `${valueToString} telemetry that collects usage data to help improve Dendron.`,
  };
};

/**
 * Constants holding all workspace config related {@link DendronConfigEntry}
 */
export const WORKSPACE = {
  NO_TELEMETRY,
  JOURNAL,
  SCRATCH,
};

export function genDefaultWorkspaceConfig(): DendronWorkspaceConfig {
  return {
    journal: genDefaultJournalConfig(),
    scratch: genDefaultScratcnConfig(),
  };
}
