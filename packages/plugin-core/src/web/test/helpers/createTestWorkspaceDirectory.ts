/* eslint-disable global-require */
import { Utils, URI } from "vscode-uri";
import * as vscode from "vscode";

/**
 * Test helper function that creates a temporary directory to act as the
 * workspace root. This function works in the browser environment
 */
export async function createTestWorkspaceDirectory(): Promise<URI> {
  const os = require("os");
  const tmp = os.tmpDir();

  const randomUUID = require("crypto-randomuuid");

  const tmpDirectory = Utils.joinPath(URI.parse(tmp), randomUUID());
  await vscode.workspace.fs.createDirectory(tmpDirectory);

  return tmpDirectory;
}
