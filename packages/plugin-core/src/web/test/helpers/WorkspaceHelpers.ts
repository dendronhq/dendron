/* eslint-disable global-require */
import { CONSTANTS } from "@dendronhq/common-all";
import YAML from "js-yaml";
import * as vscode from "vscode";
import { URI, Utils } from "vscode-uri";

export class WorkspaceHelpers {
  /**
   * Test helper function that creates a temporary directory to act as the
   * workspace root. This function works in the browser environment
   */
  static async createTestWorkspaceDirectory(): Promise<URI> {
    const os = require("os");
    const tmp = os.tmpDir();

    const randomUUID = require("crypto-randomuuid");

    const tmpDirectory = Utils.joinPath(URI.parse(tmp), randomUUID());
    await vscode.workspace.fs.createDirectory(tmpDirectory);

    return tmpDirectory;
  }

  /**
   * Create a test Dendron YAML config file at the specified location
   * @param wsRoot
   * @param config
   */
  static async createTestYAMLConfigFile(wsRoot: URI, config: any) {
    const out = YAML.dump(config, { indent: 4, schema: YAML.JSON_SCHEMA });

    await vscode.workspace.fs.writeFile(
      Utils.joinPath(wsRoot, CONSTANTS.DENDRON_CONFIG_FILE),
      new Uint8Array(Buffer.from(out, "utf-8"))
    );
  }
}
