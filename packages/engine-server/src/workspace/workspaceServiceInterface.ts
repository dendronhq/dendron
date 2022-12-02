import { DEngineClient, DVault, DendronConfig } from "@dendronhq/common-all";

export enum SyncActionStatus {
  DONE = "",
  NO_CHANGES = "it has no changes",
  NO_REMOTE = "it has no remote",
  BAD_REMOTE = "can't connect to the remote",
  NO_UPSTREAM = "the current branch has no upstream",
  SKIP_CONFIG = "it is configured so",
  NOT_PERMITTED = "user is not permitted to push to one or more vaults",
  NEW = "newly clond repository",
  CANT_STASH = "failed to stash changes in working directory",
  MERGE_CONFLICT = "has a merge conflict that needs to be resolved",
  MERGE_CONFLICT_LOSES_CHANGES = "pulling would cause a merge conflict that would lose local changes",
  MERGE_CONFLICT_AFTER_PULL = "a merge conflict happened after the pull",
  MERGE_CONFLICT_AFTER_RESTORE = "a merge conflict happened after restoring local changes",
  REBASE_IN_PROGRESS = "there's a rebase in progress",
  UNPULLED_CHANGES = "there are changes upstream that don't exist locally",
  ERROR = "error while syncing",
}

export type SyncActionResult = {
  repo: string;
  vaults: DVault[];
  status: SyncActionStatus;
};

export interface IWorkspaceService {
  get config(): PromiseLike<DendronConfig>;

  commitAndAddAll(opts: { engine: DEngineClient }): Promise<SyncActionResult[]>;

  pullVaults(): Promise<SyncActionResult[]>;

  pushVaults(): Promise<SyncActionResult[]>;

  markVaultAsRemoteInConfig(
    targetVault: DVault,
    remoteUrl: string
  ): Promise<void>;
}
