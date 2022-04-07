import textextensionslist from "textextensions";
import open from "open";
import { DendronError, ERROR_STATUS } from "@dendronhq/common-all";
import { Logger } from "../logger";
import _ from "lodash";

/** Opens the given file with the default app.
 *
 * Throws a `DendronError` on a failure. */
export class PluginFileUtils {
  private static textExtensions: ReadonlySet<string>;
  private static ensureTextExtensions() {
    if (this.textExtensions === undefined) {
      this.textExtensions = new Set(
        textextensionslist.map((extension) => extension.toLowerCase())
      );
    }
  }

  /** Checks if a given file extension is a well known text file extension. */
  static isTextFileExtension(extension: string) {
    extension = _.trimStart(extension, ".").toLowerCase();
    this.ensureTextExtensions();
    return this.textExtensions.has(extension);
  }

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
