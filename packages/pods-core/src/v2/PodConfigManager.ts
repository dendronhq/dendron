import fs from "fs-extra";
import _ from "lodash";
import path from "path";
import {
  ConfigFileUtils,
  ExportPodConfigurationV2,
  ExternalConnectionManager,
  isExportPodConfigurationV2,
  PodV2Types,
} from "..";

export class PodV2ConfigManager {
  /**
   * Get a pod config by its ID. The returned value will also have its
   * connection props in its return value
   * @param param0
   * @returns pod config if it exists, otherwise undefined
   */
  public static getPodConfigById<T extends ExportPodConfigurationV2>({
    podsDir,
    opts,
  }: {
    podsDir: string;
    opts: Pick<ExportPodConfigurationV2, "podId">;
  }): T | undefined {
    // TODO: cache for more efficient lookup
    const files = PodV2ConfigManager.getConfigFiles(podsDir);

    for (const fPath of files) {
      let config = ConfigFileUtils.getConfigByFPath({
        fPath,
      });

      if (config && config.podId && config.podId === opts.podId) {
        if (config.connectionId) {
          const mngr = new ExternalConnectionManager(podsDir);
          const connectionConfig = mngr.getConfigById({
            id: config.connectionId,
          });

          config = _.merge(config, connectionConfig);
        }

        return config;
      }
    }
    return undefined;
  }

  /**
   * Retrieve all valid pod configs in the specified directory
   * @param podsDir
   * @returns
   */
  public static getAllPodConfigs(podsDir: string): ExportPodConfigurationV2[] {
    const configs: ExportPodConfigurationV2[] = [];

    const files = PodV2ConfigManager.getConfigFiles(podsDir);

    for (const fPath of files) {
      const config = ConfigFileUtils.getConfigByFPath({
        fPath,
      });

      if (isExportPodConfigurationV2(config)) {
        configs.push(config);
      }
    }

    return configs;
  }

  private static getConfigFiles(podsDir: string): string[] {
    if (fs.existsSync(podsDir)) {
      return fs
        .readdirSync(podsDir)
        .filter((file) => file.endsWith(".yml"))
        .map((filename) => path.join(podsDir, filename));
    }
    return [];
  }

  /**
   * Get all persisted configs for a particular type of pod
   * @param type
   * @returns
   */
  public static async getAllConfigsByType(opts: {
    type: PodV2Types;
    podsDir: string;
  }): Promise<ExportPodConfigurationV2[]> {
    const { type, podsDir } = opts;
    const configs = PodV2ConfigManager.getAllPodConfigs(podsDir);
    return configs.filter((config) => config.podType === type);
  }
}
