import { genDefaultJournalConfig, JournalConfig } from "./journal";

export type DendronWorkspaceConfig = {
  journal: JournalConfig;
};

export function genDefaultWorkspaceConfig(): DendronWorkspaceConfig {
  return {
    journal: genDefaultJournalConfig(),
  };
}
