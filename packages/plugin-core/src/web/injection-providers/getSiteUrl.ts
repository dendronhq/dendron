import { ConfigUtils } from "@dendronhq/common-all";
import { Uri } from "vscode";
import { getWorkspaceConfig } from "./getWorkspaceConfig";

/**
 * Get the siteUrl from publishing config
 * @param wsRoot
 * @returns siteUrl
 */
export async function getSiteUrl(wsRoot: Uri): Promise<string | undefined> {
  const config = await getWorkspaceConfig(wsRoot);
  return ConfigUtils.getPublishing(config).siteUrl || "";
}
