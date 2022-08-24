import { ConfigUtils } from "@dendronhq/common-all";
import { Uri } from "vscode";
import { getWorkspaceConfig } from "./getWorkspaceConfig";

/**
 * Get the enablePrettlyLinks from publishing config
 * @param wsRoot
 * @returns value of enablePrettlyLinks from publishing config
 */
export async function getEnablePrettlyLinks(
  wsRoot: Uri
): Promise<boolean | undefined> {
  const config = await getWorkspaceConfig(wsRoot);
  return ConfigUtils.getEnablePrettlyLinks(config) || true;
}
