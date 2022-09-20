import { genUUID, GLOBAL_STATE_KEYS } from "@dendronhq/common-all";
import * as vscode from "vscode";

/**
 * Gets an anonymous ID for use in telemetry. If no anonymous ID exists yet,
 * then a new one is generated, stored, then returned.
 * @param storage
 * @returns
 */
export function getAnonymousId(context: vscode.ExtensionContext): string {
  const storedId = context.globalState.get<string | undefined>(
    GLOBAL_STATE_KEYS.ANONYMOUS_ID
  );

  if (storedId) {
    return storedId;
  }

  const newId = genUUID();

  context.globalState.setKeysForSync([GLOBAL_STATE_KEYS.ANONYMOUS_ID]);

  // Note: this async call is intentionally not awaited on.
  context.globalState.update(GLOBAL_STATE_KEYS.ANONYMOUS_ID, newId);

  return newId;
}
