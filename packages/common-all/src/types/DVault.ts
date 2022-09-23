import { RemoteEndpoint } from "./RemoteEndpoint";

export type DPermission = {
  read: string[];
  write: string[];
};

export enum DVaultVisibility {
  PRIVATE = "private",
}

export enum DVaultSync {
  SKIP = "skip",
  NO_PUSH = "noPush",
  NO_COMMIT = "noCommit",
  SYNC = "sync",
}

export type DVault = {
  /** Name of vault */
  name?: string;
  visibility?: DVaultVisibility;
  /** Filesystem path to vault */
  fsPath: string;
  /**
   * Indicate the workspace that this vault is part of
   */
  workspace?: string;
  remote?: RemoteEndpoint;
  // TODO
  userPermission?: DPermission;
  /**
   * If this is enabled, don't apply workspace push commands
   */
  noAutoPush?: boolean;
  /**
   * How the vault should be handled when using "add and commit" and "sync" commands.
   *
   * Options are:
   * * skip: Skip them entirely. You must manage the repository manually.
   * * noPush: Commit any changes and pull updates, but don't push. You can watch the repository and make local changes without sharing them back.
   * * noCommit: Pull and push updates if the workspace is clean, but don't commit. You manually commit your local changes, but automatically share them once you committed.
   * * sync: Commit changes, and pull and push updates. Treats workspace vaults like regular vaults.
   *
   * This setting overrides the `workspaceVaultSync` setting for the vault, even if the vault is a workspace vault.
   *
   * Defaults to `sync`.
   */
  sync?: DVaultSync;
  /**
   * Id of a seed this vault belongs to
   */
  seed?: string;
  /** Marks the vault as a self-contained vault. This is (hopefully) temporary until we eventually drop support for non-self contained vaults. */
  selfContained?: boolean;
  /**
   * Published URL endpoint for the vault.
   * When wikilinks are exported from this vault, they will be converted with url defined here
   */
  siteUrl?: string;
  /**
   * Index page for the vault
   */
  siteIndex?: string;
};
