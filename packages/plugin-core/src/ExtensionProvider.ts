import { DendronError } from "@dendronhq/common-all";
import { PodUtils } from "@dendronhq/pods-core";
import { ensureDirSync } from "fs-extra";
import _ from "lodash";
import { IDendronExtension } from "./dendronExtensionInterface";
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

  static getExtension(): IDendronExtension {
    if (_.isUndefined(ExtensionProvider.extension)) {
      throw new DendronError({
        message: `Extension is not yet registered. Make sure initialization registers extension prior to usage.`,
      });
    }

    return ExtensionProvider.extension;
  }

  static getCommentThreadsState() {
    return ExtensionProvider.extension.getCommentThreadsState();
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
    return ExtensionProvider.getExtension().isActiveAndIsDendronNote(fpath);
  }

  static getWorkspaceConfig() {
    return ExtensionProvider.getExtension().getWorkspaceConfig();
  }

  static register(extension: IDendronExtension) {
    ExtensionProvider.extension = extension;
  }

  static getPodsDir() {
    const { wsRoot } = ExtensionProvider.getDWorkspace();
    const podsDir = PodUtils.getPodDir({ wsRoot });
    ensureDirSync(podsDir);
    return podsDir;
  }
}
