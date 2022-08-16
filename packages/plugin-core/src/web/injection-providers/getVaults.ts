import {
  CONSTANTS,
  DVault,
  IntermediateDendronConfig,
} from "@dendronhq/common-all";
import YAML from "js-yaml";
import "reflect-metadata";
import * as vscode from "vscode";
import { Uri } from "vscode";

/**
 * Get all the vaults from the specified workspace root
 * @param wsRoot
 * @returns
 */
export async function getVaults(wsRoot: Uri): Promise<DVault[]> {
  const configPath = Uri.joinPath(wsRoot, CONSTANTS.DENDRON_CONFIG_FILE);
  const config = (await readYAML(
    configPath,
    true
  )) as IntermediateDendronConfig;

  return config.workspace.vaults;
}

async function readYAML(path: Uri, overwriteDuplicate?: boolean): Promise<any> {
  // @ts-ignore
  const textDecoder = new TextDecoder(); // This line of code is browser specific. For Node, we need to use the utils version of TextDecoder
  const file = await vscode.workspace.fs.readFile(path);
  const bar = textDecoder.decode(file);
  return YAML.load(bar, {
    schema: YAML.JSON_SCHEMA,
    json: overwriteDuplicate ?? false,
  });
}
