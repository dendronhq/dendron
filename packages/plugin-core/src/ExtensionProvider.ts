import { IDendronExtension } from "./dendronExtensionInterface";
import { DendronError } from "@dendronhq/common-all";
import _ from "lodash";
import { IWSUtilsV2 } from "./WSUtilsV2Interface";

/**
 * Use this to statically get implementation of IDendronExtension without having to
 * depend on concrete DendronExtension.
 *
 * Note: Prefer to get IDendronExtension injected into your classes upon their
 * construction rather than statically getting it from here. But if that's not
 * a fitting option then use this class.
 * */
export class ExtensionProvider {
  private static extension: IDendronExtension;

  /**
   * @deprecated for all NEW code, do NOT use this static method.  Inject
   * IDendronExtension into your class's constructor. This method is only meant
   * as a temporary solution to refactor existing code to no longer depend on
   * workspace.ts
   * @returns
   */
  static getExtension(): IDendronExtension {
    if (_.isUndefined(ExtensionProvider.extension)) {
      throw new DendronError({
        message: `Extension is not yet registered. Make sure initialization registers extension prior to usage.`,
      });
    }

    return ExtensionProvider.extension;
  }

  /**
   * @deprecated see {@link ExtensionProvider.getExtension}
   * @returns
   */
  static getDWorkspace() {
    return ExtensionProvider.getExtension().getDWorkspace();
  }

  /**
   * @deprecated see {@link ExtensionProvider.getExtension}
   * @returns
   */
  static getEngine() {
    return ExtensionProvider.getExtension().getEngine();
  }

  /**
   * @deprecated see {@link ExtensionProvider.getExtension}
   * @returns
   */
  static getWSUtils(): IWSUtilsV2 {
    return ExtensionProvider.getExtension().wsUtils;
  }

  /**
   * @deprecated see {@link ExtensionProvider.getExtension}
   * @returns
   */
  static register(extension: IDendronExtension) {
    ExtensionProvider.extension = extension;
  }
}
