import { DEngine } from "@dendronhq/common-all";
import { DendronEngine } from "@dendronhq/engine-server";
import _ from "lodash";
import { URI } from "vscode-uri";

export type PodOptsV2 = {
  roots: string[];
  podsDir: string;
  engine?: DEngine;
};

export abstract class PodBaseV2<TExportPodOpts extends ExportConfig = any> {
  public opts: PodOptsV2;
  private _engine: DEngine;

  constructor(opts: PodOptsV2) {
    this.opts = opts;
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

  cleanConfig(config: ExportConfig) {
    return {
      ..._.defaults(config, { includeStubs: false, includeBody: true }),
      dest: URI.file(config.dest),
    };
  }

  prepareForExport(opts: ExportPodOpts<TExportPodOpts>) {
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

export interface ExportPod<TConfig extends ExportConfig = any> {
  plant: (opts: ExportPodOpts<TConfig>) => Promise<void>;
}

export type Pod = ExportPod;

// interface ImportPod {
// }
