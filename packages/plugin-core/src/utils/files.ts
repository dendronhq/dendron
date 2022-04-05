import textextensionslist from "textextensions";
import open from "open";
import { DendronError, ERROR_STATUS } from "@dendronhq/common-all";
import { Logger } from "../logger";

export const TEXT_EXTENSIONS: ReadonlySet<string> = new Set(
  textextensionslist.map((s) => s.toLowerCase())
);

/** Opens the given file with the default app.
 *
 * Throws a `DendronError` on a failure. */
export class PluginFileUtils {
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
