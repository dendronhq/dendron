import { ConfigUtils, FuseEngine } from "@dendronhq/common-all";
import { Uri } from "vscode";
import { getWorkspaceConfig } from "./getWorkspaceConfig";

/**
 * Instantiate fuseEngine using values from config
 *
 * @param wsRoot
 * @returns fuseEngine
 */
export async function getFuseEngine(wsRoot: Uri): Promise<FuseEngine> {
  const config = await getWorkspaceConfig(wsRoot);
  return new FuseEngine({
    fuzzThreshold: ConfigUtils.getLookup(config).note.fuzzThreshold,
  });
}
