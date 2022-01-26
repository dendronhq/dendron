import {
  DEngineClient,
  DVault,
  IntermediateDendronConfig,
} from "@dendronhq/common-all";

export enum SyncActionStatus {
  DONE = "",
  NO_CHANGES = "it has no changes",
  NO_REMOTE = "it has no remote",
  NO_UPSTREAM = "the current branch has no upstream",
  SKIP_CONFIG = "it is configured so",
  NOT_PERMITTED = "user is not permitted to push to one or more vaults",
  NEW = "newly clond repository",
  CANT_STASH = "failed to stash changes in working directory",
  CANT_RESTORE = "failed to restore stashed changes",
  ERROR = "error while syncing",
}

export type SyncActionResult = {
  repo: string;
  vaults: DVault[];
  status: SyncActionStatus;
};

export interface IWorkspaceService {
  /**
   * Check if a path belongs to a workspace
   @deprecated - use {@link WorkspaceUtils.isPathInWorkspace}
   */
  isPathInWorkspace(fpath: string): boolean;

  get config(): IntermediateDendronConfig;

  commitAndAddAll(opts: { engine: DEngineClient }): Promise<SyncActionResult[]>;

  pullVaults(): Promise<SyncActionResult[]>;

  pushVaults(): Promise<SyncActionResult[]>;
}
