import {
  DendronConfigEntry,
  VaultSyncBehaviorEnum,
} from "../../types/configs/base";

export const VAULT_SYNC_BEHAVIORS: Record<
  VaultSyncBehaviorEnum,
  DendronConfigEntry<string>
> = {
  [VaultSyncBehaviorEnum.skip]: {
    value: VaultSyncBehaviorEnum.skip,
    label: "Skip",
    desc: "Skip entirely. You must manage the repository manually.",
  },
  [VaultSyncBehaviorEnum.noPush]: {
    value: VaultSyncBehaviorEnum.noPush,
    label: "No Push",
    desc: "Commit any changes and pull updates, but don't push. You can watch the repository and make local changes without sharing them back",
  },
  [VaultSyncBehaviorEnum.noCommit]: {
    value: VaultSyncBehaviorEnum.noCommit,
    label: "No Commit",
    desc: "Pull and push updates if the workspace is clean, but don't commit. You manually commit your local changes, but automatically share them once you committed.",
  },
  [VaultSyncBehaviorEnum.sync]: {
    value: VaultSyncBehaviorEnum.sync,
    label: "Sync",
    desc: "Commit changes, and pull and push updates. Treats workspace vaults like regular vaults.",
  },
};
