import { assertUnreachable } from "@dendronhq/common-all";
import fs from "fs-extra";
import path from "path";
import {
  AirtableConnection,
  ConfigFileUtils,
  GoogleDocsConnection,
  NotionConnection,
} from "../..";

/**
 * A connection to an external service
 */
export type ExternalTarget = {
  /**
   * A unique identifier for this connection
   */
  connectionId: string;

  /**
   * Type of external service this instance connects to
   */
  serviceType: ExternalService;
};

/**
 * Check if an object implements the {@link ExternalTarget} type
 * @param object
 * @returns
 */
export function isExternalTarget(object: any): object is ExternalTarget {
  return (
    object !== undefined && "connectionId" in object && "serviceType" in object
  );
}

/**
 * Types of currently supported external services
 */
export enum ExternalService {
  Airtable = "Airtable",
  GoogleDocs = "GoogleDocs",
  Notion = "Notion",
}

/**
 * Manages connection configurations to external services
 */
export class ExternalConnectionManager {
  public static subPath: string = "service-connections";
  configRootPath: string;

  constructor(configRootPath: string) {
    this.configRootPath = path.join(
      configRootPath,
      ExternalConnectionManager.subPath
    );
  }

  /**
   * Create a new configuration file for a service connection
   * @param serviceType
   * @param id a unique ID to identify this connection
   * @returns full path to the newly created config file
   */
  public async createNewConfig({
    serviceType,
    id,
  }: {
    serviceType: ExternalService;
    id: string;
  }): Promise<string> {
    if (this.getConfigById({ id })) {
      throw new Error("This ID is already in use");
    }

    switch (serviceType) {
      case ExternalService.Airtable: {
        return ConfigFileUtils.genConfigFileV2<AirtableConnection>({
          fPath: path.join(this.configRootPath, `svcconfig.${id}.yml`),
          configSchema: AirtableConnection.getSchema(),
          setProperties: { connectionId: id },
        });
      }

      case ExternalService.GoogleDocs: {
        const file = ConfigFileUtils.genConfigFileV2<GoogleDocsConnection>({
          fPath: path.join(this.configRootPath, `svcconfig.${id}.yml`),
          configSchema: GoogleDocsConnection.getSchema(),
          setProperties: { connectionId: id },
        });
        return file;
      }
      case ExternalService.Notion: {
        const file = ConfigFileUtils.genConfigFileV2<NotionConnection>({
          fPath: path.join(this.configRootPath, `svcconfig.${id}.yml`),
          configSchema: NotionConnection.getSchema(),
          setProperties: { connectionId: id },
        });
        return file;
      }
      default:
        assertUnreachable();
    }
  }

  /**
   * Get a config by its ID, if it exists. The config file must have a valid
   * connectionId property.
   * @template T - Type of the Config being retrieved
   * @param param0 connection ID of the config to retrieve
   * @returns the config if it exists, otherwise undefined
   */
  public getConfigById<T extends ExternalTarget>({
    id,
  }: {
    id: string;
  }): T | undefined {
    const files = this.getConfigFiles();

    for (const fileName of files) {
      const config = ConfigFileUtils.getConfigByFPath({
        fPath: path.join(this.configRootPath, fileName),
      });

      if (config && config.connectionId && config.connectionId === id) {
        return config;
      }
    }
    return undefined;
  }

  /**
   * Get all valid configurations. Invalid configurations will not be returned
   * @returns
   */
  public async getAllValidConfigs(): Promise<ExternalTarget[]> {
    const files = this.getConfigFiles();

    const validConfigs: ExternalTarget[] = [];
    files.forEach((file) => {
      const config = ConfigFileUtils.getConfigByFPath({
        fPath: path.join(this.configRootPath, file),
      });

      if (isExternalTarget(config)) {
        validConfigs.push(config);
      }
    });

    return validConfigs;
  }

  /**
   * Get all configs for a particular type of external service
   * @param type
   * @returns
   */
  public async getAllConfigsByType(
    type: ExternalService
  ): Promise<ExternalTarget[]> {
    const allValidConfigs = await this.getAllValidConfigs();
    return allValidConfigs.filter((config) => config.serviceType === type);
  }

  private getConfigFiles(): string[] {
    if (fs.existsSync(this.configRootPath)) {
      return fs
        .readdirSync(this.configRootPath)
        .filter((file) => file.endsWith(".yml"));
    }
    return [];
  }
}
