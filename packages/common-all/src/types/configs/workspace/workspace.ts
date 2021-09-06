import { genDefaultJournalConfig, JournalConfig, JOURNAL } from "./journal";

/**
 * Namespace for configurations that affect the workspace
 */
export type DendronWorkspaceConfig = {
  journal: JournalConfig;
};

/**
 * Constants holding all workspace config related {@link DendronConfigEntry}
 */
export const WORKSPACE = {
  JOURNAL,
};

export function genDefaultWorkspaceConfig(): DendronWorkspaceConfig {
  return {
    journal: genDefaultJournalConfig(),
  };
}
