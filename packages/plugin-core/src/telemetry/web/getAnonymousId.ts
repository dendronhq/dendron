import { genUUID, GLOBAL_STATE_KEYS, IDataStore } from "@dendronhq/common-all";

/**
 * Gets an anonymous ID for use in telemetry. If no anonymous ID exists yet,
 * then a new one is generated, stored, then returned.
 * @param storage
 * @returns
 */
export async function getAnonymousId(
  storage: IDataStore<string, string>
): Promise<string> {
  const resp = await storage.get(GLOBAL_STATE_KEYS.ANONYMOUS_ID);

  if (resp.error) {
    throw resp.error;
  }

  if (resp.data) {
    return resp.data;
  } else {
    const newId = genUUID();
    await storage.write(GLOBAL_STATE_KEYS.ANONYMOUS_ID, newId);
    return newId;
  }
}
