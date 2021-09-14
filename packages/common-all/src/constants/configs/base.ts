import {
  DendronConfigEntry,
  VaultSyncModeEnum,
} from "../../types/configs/base";

export const VAULT_SYNC_MODES: Record<
  VaultSyncModeEnum,
  DendronConfigEntry<string>
> = {
  [VaultSyncModeEnum.skip]: {
    value: VaultSyncModeEnum.skip,
    label: "Skip",
    desc: "Skip entirely. You must manage the repository manually.",
  },
  [VaultSyncModeEnum.noPush]: {
    value: VaultSyncModeEnum.noPush,
    label: "No Push",
    desc: "Commit any changes and pull updates, but don't push. You can watch the repository and make local changes without sharing them back",
  },
  [VaultSyncModeEnum.noCommit]: {
    value: VaultSyncModeEnum.noCommit,
    label: "No Commit",
    desc: "Pull and push updates if the workspace is clean, but don't commit. You manually commit your local changes, but automatically share them once you committed.",
  },
  [VaultSyncModeEnum.sync]: {
    value: VaultSyncModeEnum.sync,
    label: "Sync",
    desc: "Commit changes, and pull and push updates. Treats workspace vaults like regular vaults.",
  },
};
