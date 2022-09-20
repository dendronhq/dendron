import { VSCodeUtils } from "./vsCodeUtils";
import { NodeJSUtils } from "@dendronhq/common-server";
import vscode from "vscode";
import { extensionQualifiedId } from "./constants";
import _ from "lodash";

/**
 * @deprecated - use vscode.ExtensionContext.extension.packageJSON.version instead.
 */
export class VersionProvider {
  static version() {
    let version: string | undefined;
    if (VSCodeUtils.isDevMode()) {
      version = NodeJSUtils.getVersionFromPkg();
    } else {
      try {
        const dendronExtension =
          vscode.extensions.getExtension(extensionQualifiedId)!;
        version = dendronExtension.packageJSON.version;
      } catch (err) {
        version = NodeJSUtils.getVersionFromPkg();
      }
    }
    if (_.isUndefined(version)) {
      version = "0.0.0";
    }
    return version;
  }
}
