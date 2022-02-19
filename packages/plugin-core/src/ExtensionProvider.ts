import { IDendronExtension } from "./dendronExtensionInterface";
import { DendronError, DendronTreeViewKey } from "@dendronhq/common-all";
import _ from "lodash";
import { IWSUtilsV2 } from "./WSUtilsV2Interface";
import { WorkspaceUtils } from "@dendronhq/engine-server";

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

  static getExtension(): IDendronExtension {
    if (_.isUndefined(ExtensionProvider.extension)) {
      throw new DendronError({
        message: `Extension is not yet registered. Make sure initialization registers extension prior to usage.`,
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

  static getWSUtils(): IWSUtilsV2 {
    return ExtensionProvider.getExtension().wsUtils;
  }

  static isActive() {
    return ExtensionProvider.getExtension().isActive();
  }

  static isActiveAndIsDendronNote(fpath: string) {
    if (!this.isActive()) {
      return false;
    }
    const { wsRoot, vaults } = this.getDWorkspace();
    return WorkspaceUtils.isDendronNote({
      wsRoot,
      vaults,
      fpath,
    });
  }

  static getWorkspaceConfig() {
    return ExtensionProvider.getExtension().getWorkspaceConfig();
  }

  /**
   * @deprecated. See {@link IDendronExtension.getTreeView}
   */
  static getTreeView(key: DendronTreeViewKey) {
    return ExtensionProvider.getExtension().getTreeView(key);
  }

  static register(extension: IDendronExtension) {
    ExtensionProvider.extension = extension;
  }
}
