import { ResultAsync } from "neverthrow";
import { DendronError } from "../error";
// import { URI } from "vscode-uri";
import { ConfigCreateResult, IConfigStore } from "./IConfigStore";
// import { ConfigUtils } from "../utils";

/**
 * This is a dummy implementation of config store
 * used for review / discussion purposes
 */
export class DummyConfigStore implements IConfigStore {
  // configPath: ...;

  create(): ResultAsync<ConfigCreateResult, DendronError> {
    const result = {} as ConfigCreateResult;
    return ResultAsync.fromSafePromise(Promise.resolve(result));
  }
}
