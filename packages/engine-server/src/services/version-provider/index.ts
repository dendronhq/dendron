import { NodeJSUtils } from "@dendronhq/common-server";

export class VersionProvider {
  static engineVersion(): string {
    return NodeJSUtils.getVersionFromPkg();
  }
}
