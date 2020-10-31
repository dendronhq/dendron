import { DEngine, DEngineClientV2 } from "@dendronhq/common-all";
import {
  DendronEngine,
  DendronEngineV2,
  FileStorageV2,
} from "@dendronhq/engine-server";
import _ from "lodash";
import { URI } from "vscode-uri";
import { PodKind } from "./types";
import {
  Logger,
  createLogger,
  resolvePath,
  DLogger,
} from "@dendronhq/common-server";

export type PodOptsV2 = {
  roots: string[];
  wsRoot: string;
  engine?: DEngine;
};

export type PodOptsV3 = {
  vaults: string[];
  wsRoot: string;
  engine?: DEngineClientV2;
};

export type PodConfigEntry = {
  key: string;
  description: string;
  type: "string" | "number" | "boolean";
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
        forceNew: true,
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

export abstract class PodBaseV3 {
  public opts: PodOptsV3;
  public L: DLogger;
  public engine: DEngineClientV2;

  constructor(opts: PodOptsV3) {
    this.opts = opts;

    const vaults = this.opts.vaults;
    this.L = createLogger("PodLogger");
    this.engine = opts.engine
      ? opts.engine
      : new DendronEngineV2({
          vaults,
          forceNew: true,
          store: new FileStorageV2({ vaults, logger: this.L }),
          mode: "fuzzy",
          logger: this.L,
        });
  }

  async initEngine() {
    await this.engine.init();
  }
}

export abstract class PublishPodBaseV3<
  TConfig extends PublishConfig = PublishConfig
> extends PodBaseV3 {
  static kind = "publish" as PodKind;

  getDefaultConfig(): Required<PublishConfig> {
    return {
      dest: "stdout",
    };
  }

  abstract plant(opts: PublishPodOpts<TConfig>): Promise<any>;
}

export abstract class ExportPodBaseV2<
  TConfig extends ExportConfig = ExportConfig
> extends PodBaseV2 implements ExportPod<TConfig> {
  static kind = "export" as PodKind;

  cleanConfig(config: ExportConfig) {
    return {
      ..._.defaults(config, { includeStubs: false, includeBody: true }),
      dest: URI.file(resolvePath(config.dest, this.opts.wsRoot)),
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

export abstract class ExportPodBaseV3<
  TConfig extends ExportConfig = ExportConfig
> extends PodBaseV3 implements ExportPod<TConfig> {
  static kind = "export" as PodKind;

  sub(orig: string) {
    const mapping = {
      $wsRoot: this.opts.wsRoot,
    };
    _.each(mapping, (v, k) => {
      orig = _.replace(orig, k, v);
    });
    return orig;
  }

  cleanConfig(config: ExportConfig) {
    let dest = this.sub(config.dest);
    return {
      ..._.defaults(config, { includeStubs: false, includeBody: true }),
      dest: URI.file(resolvePath(dest, this.opts.wsRoot)),
    };
  }

  prepareForExport(opts: ExportPodOpts<TConfig>) {
    this.initEngine();
    let nodes = _.values(this.engine[opts.mode]);
    if (!opts.config.includeStubs) {
      nodes = _.reject(nodes, { stub: true });
    }
    return nodes;
  }

  abstract plant(opts: ExportPodOpts<TConfig>): Promise<any>;
}

export abstract class ImportPodBaseV2<TConfig extends ImportConfig = any>
  extends PodBaseV2
  implements ImportPod<TConfig> {
  static kind = "import" as PodKind;

  cleanConfig(config: ImportConfig) {
    return {
      ..._.defaults(config),
      src: URI.file(resolvePath(config.src, this.opts.wsRoot)),
    };
  }

  async prepare(_opts: ImportPodOpts<TConfig>) {
    await this.initEngine();
  }

  abstract plant(opts: ImportPodOpts<TConfig>): Promise<void>;
}

export abstract class ImportPodBaseV3<TConfig extends ImportConfig = any>
  extends PodBaseV3
  implements ImportPod<TConfig> {
  static kind = "import" as PodKind;

  cleanConfig(config: ImportConfig) {
    return {
      ..._.defaults(config),
      src: URI.file(resolvePath(config.src, this.opts.wsRoot)),
    };
  }

  /**
   * Initialize the engine
   * @param _opts
   */
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

export type ExportCleanConfig = {
  dest: URI;
  /**
   * Default: false
   */
  includeStubs: boolean;
  /**
   * Default: true
   */
  includeBody: boolean;
};

export type PublishConfig = {
  dest: string;
};

export type ImportConfig = {
  src: string;
};

export type ExportPodOpts<TConfig extends Partial<ExportConfig>> = {
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
export type PublishPodOpts<TConfig extends PublishConfig = PublishConfig> = {
  /**
   * Export schema or notes
   */
  mode: "notes" | "schemas";
  /**
   * Only export metadata?
   */
  config?: TConfig;
  /**
   * What note to publish
   */
  fname: string;
};

export interface ExportPod<TConfig extends ExportConfig = any> {
  plant: (opts: ExportPodOpts<TConfig>) => Promise<void>;
}

export interface PublishPod<TConfig extends PublishConfig = any> {
  plant: (opts: PublishPodOpts<TConfig>) => Promise<void>;
}

export type Pod = {
  plant: (opts: any) => Promise<any>;
};

export interface ImportPod<TConfig extends ImportConfig = any> {
  plant: (opts: ImportPodOpts<TConfig>) => Promise<void>;
}
