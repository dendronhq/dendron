import { IDendronExtension } from "./dendronExtensionInterface";
import { DendronError } from "@dendronhq/common-all";
import _ from "lodash";

/**
 * Use this to statically get implementation of IDendronExtension without having to
 * depend on concrete DendronExtension.
 *
 * Note: Prefer to get IDendronExtension injected into your classes upon their
 * construction rather than statically getting it from here. But if that's not
 * a fitting option then use this class.
 * */
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

  static getDWorkspace() {
    return ExtensionProvider.getExtension().getDWorkspace();
  }

  static getEngine() {
    return ExtensionProvider.getExtension().getEngine();
  }

  static register(extension: IDendronExtension) {
    ExtensionProvider.extension = extension;
  }
}
