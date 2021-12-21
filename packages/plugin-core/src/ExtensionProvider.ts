import { IDendronExtension } from "./dendronExtensionInterface";
import { DendronError } from "@dendronhq/common-all";
import _ from "lodash";

export class ExtensionProvider {
  static extension: IDendronExtension;

  static getExtension(): IDendronExtension {
    if (_.isUndefined(ExtensionProvider.extension)) {
      throw new DendronError({
        message: `Extension is not yet registered. Maker sure initialization registers extension prior to usage.`,
      });
    }

    return ExtensionProvider.extension;
  }

  static register(extension: IDendronExtension) {
    ExtensionProvider.extension = extension;
  }
}
