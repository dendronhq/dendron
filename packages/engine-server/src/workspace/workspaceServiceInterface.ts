export interface IWorkspaceService {
  /**
   * Check if a path belongs to a workspace
   @deprecated - use {@link WorkspaceUtils.isPathInWorkspace}
   */
  isPathInWorkspace(fpath: string): boolean;
}
