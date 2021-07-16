import {
  AssetGetRequest,
  AssetGetThemeRequest,
  DendronError,
  ERROR_STATUS,
  getStage,
  RespV2,
  ThemeTarget, ThemeType
} from "@dendronhq/common-all";
import { WorkspaceUtils } from "@dendronhq/engine-server";
import { getWS } from "../utils";
import fs from "fs-extra";
import path from "path";
import { getLogger } from "../core";

export class AssetsController {
  static singleton?: AssetsController;

  static instance() {
    if (!AssetsController.singleton) {
      AssetsController.singleton = new AssetsController();
    }
    return AssetsController.singleton;
  }

  async get({ fpath, ws }: AssetGetRequest): Promise<RespV2<string>> {
    const engine = await getWS({ ws });
    const { wsRoot, vaults } = engine;
    if (!WorkspaceUtils.isPathInWorkspace({ wsRoot, vaults, fpath })) {
      return {
        error: DendronError.createFromStatus({
          status: ERROR_STATUS.INVALID_CONFIG,
          message: `fpath ${fpath} not inside a vault. wsRoot: ${wsRoot}, vaults: ${vaults
            .map((v) => v.fsPath)
            .join(", ")}`,
        }),
      };
    }
    if (!fs.existsSync(fpath)) {
      return {
        error: DendronError.createFromStatus({
          status: ERROR_STATUS.DOES_NOT_EXIST,
          message: `fpath ${fpath} does not exist`,
        }),
      };
    }
    return {
      data: fpath,
      error: null,
    };
  }

  async getTheme({ themeTarget, themeType }: AssetGetThemeRequest): Promise<RespV2<string>> {
    const ctx = "Assets:getTheme"
    const stage = getStage();
    const logger = getLogger();
    logger.info({ctx, themeTarget, themeType, stage});
    let root: string;
    if (stage !== "prod") {
      // lib/modules/
      root = path.join(__dirname, "..", "..", "assets");
    } else {
      root = __dirname
    }

    const getPathForTarget = ({themeTarget}:{themeTarget: ThemeTarget}) => {
      const themeDir = path.join(root, "static", "themes");
      if (themeTarget === ThemeTarget.PRISM) {
        return path.join(themeDir, "prism");
      }
      return DendronError.createFromStatus({
        status: ERROR_STATUS.INVALID_CONFIG,
        message: `target ${themeTarget} not valid`,
      });
    }
    const getFileForType = ({themeType, targetRoot}:{themeType: ThemeType, targetRoot: string}) => {
      return path.join(targetRoot, `${themeType}.css`)
    }
    const targetRoot = getPathForTarget({themeTarget})
    if (targetRoot instanceof DendronError) {
      return {error: targetRoot};
    }
    const pathForTarget = getFileForType({themeType, targetRoot});
    logger.info({ctx, pathForTarget});

    return {
      data: pathForTarget,
      error: null
    }
  }
}
