import { DEngine } from "@dendronhq/common-all";
import { DendronEngine } from "@dendronhq/engine-server";
import _ from "lodash";
import { URI } from "vscode-uri";
import { PodKind } from "./types";
import { Logger, createLogger } from "@dendronhq/common-server";

export type PodOptsV2 = {
  roots: string[];
  engine?: DEngine;
};

export type PodConfigEntry = {
  key: string;
  description: string;
  type: "string" | "number";
  default?: any;
};

export abstract class PodBaseV2 {
  public opts: PodOptsV2;
  private _engine: DEngine;
  public L: Logger;

  constructor(opts: PodOptsV2) {
    this.opts = opts;
    // @ts-ignore
    // TODO: change
    this.L = createLogger("PodLogger");
    if (!_.isUndefined(this.opts.engine)) {
      this._engine = this.opts.engine;
    } else {
      this._engine = DendronEngine.getOrCreateEngine({
        root: this.opts.roots[0],
      });
    }
  }

  get engine(): DEngine {
    return this._engine;
  }

  async initEngine() {
    await this.engine.init();
  }
}

export abstract class ExportPodBaseV2<
  TConfig extends ExportConfig = ExportConfig
> extends PodBaseV2 implements ExportPod<TConfig> {
  static kind = "export" as PodKind;

  cleanConfig(config: ExportConfig) {
    return {
      ..._.defaults(config, { includeStubs: false, includeBody: true }),
      dest: URI.file(config.dest),
    };
  }

  prepareForExport(opts: ExportPodOpts<TConfig>) {
    this.initEngine();
    let nodes = _.values(this.engine[opts.mode]);
    const hideBody = opts.config.includeBody ? false : true;
    if (!opts.config.includeStubs) {
      nodes = _.reject(nodes, { stub: true });
    }
    const payload: any = _.map(nodes, (ent) => {
      return ent.toRawProps(hideBody);
    });
    return payload;
  }

  abstract plant(opts: ExportPodOpts<TConfig>): Promise<void>;
}

export abstract class ImportPodBaseV2<TConfig extends ImportConfig = any>
  extends PodBaseV2
  implements ImportPod<TConfig> {
  static kind = "import" as PodKind;

  cleanConfig(config: ImportConfig) {
    return {
      ..._.defaults(config),
      src: URI.file(config.src),
    };
  }

  async prepare(_opts: ImportPodOpts<TConfig>) {
    await this.initEngine();
  }

  abstract plant(opts: ImportPodOpts<TConfig>): Promise<void>;
}

export type ExportConfig = {
  dest: string;
  /**
   * Default: false
   */
  includeStubs?: boolean;
  /**
   * Default: true
   */
  includeBody?: boolean;
};
export type ImportConfig = {
  src: string;
};

export type ExportPodOpts<TConfig extends ExportConfig> = {
  /**
   * Export schema or notes
   */
  mode: "notes" | "schemas";
  /**
   * Only export metadata?
   */
  config: TConfig;
};
export type ImportPodOpts<TConfig extends ImportConfig> = {
  /**
   * Export schema or notes
   */
  mode: "notes" | "schemas";
  /**
   * Only export metadata?
   */
  config: TConfig;
};

export interface ExportPod<TConfig extends ExportConfig = any> {
  plant: (opts: ExportPodOpts<TConfig>) => Promise<void>;
}

export type Pod = ExportPod;

export interface ImportPod<TConfig extends ImportConfig = any> {
  plant: (opts: ImportPodOpts<TConfig>) => Promise<void>;
}
