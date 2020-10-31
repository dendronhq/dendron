import { DEngineClientV2, DVault } from "@dendronhq/common-all";
import { createLogger, DLogger } from "@dendronhq/common-server";
import { URI } from "vscode-uri";

export abstract class BasePod {
  public L: DLogger;
  constructor() {
    this.L = createLogger("PodLogger");
  }
}

export type PodConfig = {
  key: string;
  description: string;
  type: "string" | "number" | "boolean";
  default?: any;
};

export type ExportPodRawConfig = {
  dest: string;
};

export type ExportPodCleanConfig = {
  dest: URI;
};

export type ExportPodPlantOpts<TConfig> = {
  wsRoot: string;
  vaults: DVault[];
  engine: DEngineClientV2;
  config: TConfig;
};

export type ExportPodExecuteOpts<TConfig extends ExportPodRawConfig> = {
  config: TConfig;
  engine: DEngineClientV2;
  wsRoot: string;
  vaults: DVault[];
};

export abstract class ExportPod<
  TConfigRaw extends ExportPodRawConfig,
  TConfigClean extends ExportPodCleanConfig
> {
  abstract config: PodConfig[];
  abstract clean(opts: {
    config: Partial<TConfigRaw>;
    wsRoot: string;
  }): Promise<TConfigClean>;
  abstract plant(opts: ExportPodPlantOpts<TConfigClean>): Promise<any>;

  async execute(opts: ExportPodExecuteOpts<TConfigRaw>) {
    const { config, engine, wsRoot, vaults } = opts;
    await engine.init();
    const cleanConfig = await this.clean({ config, wsRoot });
    return this.plant({ config: cleanConfig, wsRoot, vaults, engine });
  }
}
