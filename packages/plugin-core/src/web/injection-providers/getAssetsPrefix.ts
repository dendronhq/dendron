import { ConfigUtils } from "@dendronhq/common-all";
import { Uri } from "vscode";
import { getWorkspaceConfig } from "./getWorkspaceConfig";

/**
 * Get the assetsPrefix from publishing config
 * @param wsRoot
 * @returns assetsPrefix
 */
export async function getAssetsPrefix(
  wsRoot: Uri
): Promise<string | undefined> {
  const config = await getWorkspaceConfig(wsRoot);
  return ConfigUtils.getAssetsPrefix(config) || "";
}
