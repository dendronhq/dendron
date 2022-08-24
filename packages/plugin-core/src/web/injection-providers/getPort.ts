import { CONSTANTS } from "@dendronhq/common-all";
import { URI, Utils } from "vscode-uri";
import * as vscode from "vscode";
import _ from "lodash";

/**
 * NOTE: this only works in browser (TextDecoder dependency);
 * @param wsRoot
 * @returns
 */
export async function getPort(wsRoot: URI) {
  // TODO: Re-enable, but we don't actually need a port
  return Promise.resolve(1);
  // const portFileUri = Utils.joinPath(wsRoot, CONSTANTS.DENDRON_SERVER_PORT);

  // const raw = await vscode.workspace.fs.readFile(portFileUri);

  // // @ts-ignore - this needs to use browser's TextDecoder, not an import from node utils
  // const textDecoder = new TextDecoder();
  // const data = textDecoder.decode(raw);

  // return _.toInteger(_.trim(data));
}
