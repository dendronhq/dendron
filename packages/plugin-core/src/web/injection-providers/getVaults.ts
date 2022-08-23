import { DVault } from "@dendronhq/common-all";
import "reflect-metadata";
import { Uri } from "vscode";
import { getWorkspaceConfig } from "./getWorkspaceConfig";

/**
 * Get all the vaults from the specified workspace root
 * @param wsRoot
 * @returns
 */
export async function getVaults(wsRoot: Uri): Promise<DVault[]> {
  const config = await getWorkspaceConfig(wsRoot);
  return config.workspace.vaults;
}
