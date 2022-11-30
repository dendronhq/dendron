import {
  CleanDendronPublishingConfig,
  ConfigUtils,
  CONSTANTS,
  DeepPartial,
  DendronError,
  DendronPublishingConfig,
  ErrorFactory,
  ErrorUtils,
  ERROR_STATUS,
  getStage,
  GithubEditViewModeEnum,
  IDendronError,
  RespV3,
  RespWithOptError,
  DendronConfig,
  YamlUtils,
} from "@dendronhq/common-all";
import fs from "fs-extra";
import _ from "lodash";
import os from "os";
import path from "path";
import { BackupKeyEnum, BackupService } from "./backup";
import { DConfigLegacy } from "./oneoff/ConfigCompat";
import { readYAML, readString } from "./files";

export enum LocalConfigScope {
  WORKSPACE = "WORKSPACE",
  GLOBAL = "GLOBAL",
}

let _dendronConfig: DendronConfig | undefined;

/**
 * @deprecated
 */
export class DConfig {
  /**
   * @deprecated
   * Use {@link ConfigService.configPath} instead
   * e.g.) const configPath = ConfigService.instance().configPath(URI.file(wsRoot))
   */
  static configPath(configRoot: string): string {
    return path.join(configRoot, CONSTANTS.DENDRON_CONFIG_FILE);
  }

  /**
   * @deprecated
   * use {@link ConfigService.configOverridePath} instead
   * e.g.) const overridePath = ConfigService.instance().configOverridePath(URI.file(wsRoot), "workspace")
   */
  static configOverridePath(wsRoot: string, scope: LocalConfigScope): string {
    const configPath =
      scope === LocalConfigScope.GLOBAL ? os.homedir() : wsRoot;
    return path.join(configPath, CONSTANTS.DENDRON_LOCAL_CONFIG_FILE);
  }

  /**
   * @deprecated
   * This will be moved to a more suitable location in the near future
   */
  static getSiteIndex(sconfig: DendronPublishingConfig): string {
    const { siteIndex, siteHierarchies } = sconfig;
    return siteIndex || siteHierarchies[0];
  }

  /**
   * @deprecated
   * fill in defaults
   * This will be moved to a more suitable location in the near future
   */
  static cleanPublishingConfig(
    config: DendronPublishingConfig
  ): CleanDendronPublishingConfig {
    const out = _.defaultsDeep(config, {
      copyAssets: true,
      enablePrettyRefs: true,
      siteFaviconPath: "favicon.ico",
      github: {
        enableEditLink: true,
        editLinkText: "Edit this page on Github",
        editBranch: "main",
        editViewMode: GithubEditViewModeEnum.edit,
      },
      writeStubs: true,
      seo: {
        description: "Personal Knowledge Space",
      },
    });
    const { siteRootDir, siteHierarchies } = out;
    let { siteIndex, siteUrl } = out;
    if (process.env["SITE_URL"]) {
      siteUrl = process.env["SITE_URL"];
    }
    if (!siteRootDir) {
      throw new DendronError({ message: "siteRootDir is undefined" });
    }
    if (!siteUrl && getStage() === "dev") {
      // this gets overridden in dev so doesn't matter
      siteUrl = "https://foo";
    }
    if (!siteUrl) {
      throw DendronError.createFromStatus({
        status: ERROR_STATUS.INVALID_CONFIG,
        message:
          "siteUrl is undefined. See https://dendron.so/notes/f2ed8639-a604-4a9d-b76c-41e205fb8713.html#siteurl for more details",
      });
    }
    if (_.size(siteHierarchies) < 1) {
      throw DendronError.createFromStatus({
        status: ERROR_STATUS.INVALID_CONFIG,
        message: `siteHiearchies must have at least one hierarchy`,
      });
    }
    siteIndex = this.getSiteIndex(config);
    return {
      ...out,
      siteIndex,
      siteUrl,
    };
  }

  /**
   * @deprecated
   * This will be moved to a more suitable location in the near future
   */
  static setCleanPublishingConfig(opts: {
    config: DendronConfig;
    cleanConfig: DendronPublishingConfig;
  }) {
    const { config, cleanConfig } = opts;
    ConfigUtils.setProp(config, "publishing", cleanConfig);
  }

  /**
   * @deprecated should be removed when we roll out engine v3
   *
   * Use {@link ConfigService.searchOverride} instead
   * e.g.)
   * searchOverrideResult = await ConfigService.instance().searchOverride(URI.file(wsRoot))
   *
   * See if a local config file is present
   */
  static searchLocalConfigSync(wsRoot: string): RespV3<DendronConfig> {
    const wsPath = path.join(wsRoot, CONSTANTS.DENDRON_LOCAL_CONFIG_FILE);
    const globalPath = path.join(
      os.homedir(),
      CONSTANTS.DENDRON_LOCAL_CONFIG_FILE
    );
    let foundPath: string | undefined;

    if (fs.existsSync(globalPath)) {
      foundPath = globalPath;
    }
    if (fs.existsSync(wsPath)) {
      foundPath = wsPath;
    }
    if (foundPath) {
      // TODO: do validation in the future
      const data = readYAML(foundPath) as DendronConfig;
      return { data };
    }
    return {
      error: ErrorFactory.create404Error({
        url: CONSTANTS.DENDRON_LOCAL_CONFIG_FILE,
      }),
    };
  }

  /**
   * @deprecated should be removed when we roll out engine v3
   *
   * Use {@link ConfigService.readConfig} instead
   * e.g.)
   * const readResult = await ConfigService.instance().readConfig(URI.file(wsRoot), { applyOverride: false });
   *
   * Read configuration
   * @param wsRoot
   * @param useCache: If true, read from cache instead of file system
   * @returns
   */
  static readConfigSync(wsRoot: string, useCache?: boolean) {
    if (_dendronConfig && useCache) {
      return _dendronConfig;
    }
    const configPath = DConfig.configPath(wsRoot);
    const dendronConfigResult = readString(configPath)
      .andThen((input) => YamlUtils.fromStr(input, true))
      .andThen((unknownconfig) => {
        const cleanConfig = DConfigLegacy.configIsV4(unknownconfig)
          ? DConfigLegacy.v4ToV5(unknownconfig)
          : _.defaultsDeep(unknownconfig, ConfigUtils.genDefaultConfig());

        return ConfigUtils.parse(cleanConfig);
      })
      .map((dendronConfig) => {
        _dendronConfig = dendronConfig;
        return dendronConfig;
      });

    if (dendronConfigResult.isErr()) {
      throw dendronConfigResult.error;
    }
    return dendronConfigResult.value;
  }

  /**
   * @deprecated should be removed when we roll out engine v3
   *
   * Use {@link ConfigService.readConfig} instead
   * e.g.)
   * const readResult = await ConfigService.instance().readConfig(URI.file(wsRoot));
   *
   * Read config and merge with local config
   * @param wsRoot
   * @param useCache: If true, read from cache instead of file system
   * @returns
   */
  static readConfigAndApplyLocalOverrideSync(
    wsRoot: string,
    useCache?: boolean
  ): RespWithOptError<DendronConfig> {
    const config = this.readConfigSync(wsRoot, useCache);
    const maybeLocalConfig = this.searchLocalConfigSync(wsRoot);

    let localConfigValidOrError: boolean | IDendronError = true;

    if (maybeLocalConfig.data) {
      const respValidate = this.validateLocalConfig({
        config: maybeLocalConfig.data,
      });
      if (respValidate.error) {
        localConfigValidOrError = respValidate.error;
      }

      if (!respValidate.error) {
        _.mergeWith(
          config,
          maybeLocalConfig.data,
          (objValue: any, srcValue: any) => {
            // TODO: optimize, check for keys of known arrays instead
            if (_.isArray(objValue)) {
              return srcValue.concat(objValue);
            }
            return;
          }
        );
      }
    }
    return {
      data: config,
      error: ErrorUtils.isDendronError(localConfigValidOrError)
        ? localConfigValidOrError
        : undefined,
    };
  }

  /**
   * @deprecated should be removed when we roll out engine v3
   *
   * Use {@link ConfigUtils.validateLocalConfig} instead
   *
   * Sanity check local config properties
   */
  static validateLocalConfig({
    config,
  }: {
    config: DeepPartial<DendronConfig>;
  }): RespV3<boolean> {
    if (config.workspace) {
      if (
        _.isEmpty(config.workspace) ||
        (config.workspace.vaults && !_.isArray(config.workspace.vaults))
      ) {
        return {
          error: new DendronError({
            message:
              "workspace must not be empty and vaults must be an array if workspace is set",
          }),
        };
      }
    }
    return { data: true };
  }

  /**
   * @deprecated TODO: move to ConfigService
   * Create a backup of dendron.yml with an optional custom infix string.
   * e.g.) createBackup(wsRoot, "foo") will result in a backup file name
   * `dendron.yyyy.MM.dd.HHmmssS.foo.yml`
   * @param wsRoot workspace root
   * @param infix custom string used in the backup name
   * ^fd66z8uiuczz
   */
  static async createBackup(wsRoot: string, infix?: string): Promise<string> {
    const backupService = new BackupService({ wsRoot });
    try {
      const configPath = DConfig.configPath(wsRoot);
      const backupResp = await backupService.backup({
        key: BackupKeyEnum.config,
        pathToBackup: configPath,
        timestamp: true,
        infix,
      });
      if (backupResp.error) {
        throw new DendronError({ ...backupResp.error });
      }
      return backupResp.data;
    } finally {
      backupService.dispose();
    }
  }
}
