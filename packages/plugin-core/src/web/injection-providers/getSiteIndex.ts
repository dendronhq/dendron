import { ConfigUtils } from "@dendronhq/common-all";
import { Uri } from "vscode";
import { getWorkspaceConfig } from "./getWorkspaceConfig";

/**
 * Get the siteIndex from publishing config
 * @param wsRoot
 * @returns siteIndex
 */
export async function getSiteIndex(wsRoot: Uri): Promise<string | undefined> {
  const config = await getWorkspaceConfig(wsRoot);
  return (
    ConfigUtils.getPublishing(config).siteIndex ||
    ConfigUtils.getPublishing(config).siteHierarchies[0]
  );
}
