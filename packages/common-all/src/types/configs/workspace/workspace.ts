import { genDefaultJournalConfig, JournalConfig, JOURNAL } from "./journal";
import { genDefaultScratcnConfig, ScratchConfig, SCRATCH } from "./scratch";

/**
 * Namespace for configurations that affect the workspace
 */
export type DendronWorkspaceConfig = {
  journal: JournalConfig;
  scratch: ScratchConfig;
};

/**
 * Constants holding all workspace config related {@link DendronConfigEntry}
 */
export const WORKSPACE = {
  JOURNAL,
  SCRATCH,
};

export function genDefaultWorkspaceConfig(): DendronWorkspaceConfig {
  return {
    journal: genDefaultJournalConfig(),
    scratch: genDefaultScratcnConfig(),
  };
}
