import open from "open";
import { DendronError, ERROR_STATUS } from "@dendronhq/common-all";
import { Logger } from "../logger";
import _ from "lodash";

export class PluginFileUtils {
  /** Opens the given file with the default app.
   *
   * Logs if opening the file with the default app failed.
   */
  static async openWithDefaultApp(filePath: string) {
    await open(filePath).catch((err) => {
      const error = DendronError.createFromStatus({
        status: ERROR_STATUS.UNKNOWN,
        innerError: err,
      });
      Logger.error({ error });
    });
  }
}
