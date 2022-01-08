import { IntermediateDendronConfig } from "@dendronhq/common-all";

export interface IWorkspaceService {
  /**
   * Check if a path belongs to a workspace
   @deprecated - use {@link WorkspaceUtils.isPathInWorkspace}
   */
  isPathInWorkspace(fpath: string): boolean;

  get config(): IntermediateDendronConfig;
}
