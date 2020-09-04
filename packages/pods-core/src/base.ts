import { URI } from "vscode-uri";
import { DEngine } from "@dendronhq/common-all";
import { DendronEngine } from "@dendronhq/engine-server";
import _ from "lodash";

type PodOpts = {
  roots: string[];
  engine?: DEngine;
};

export abstract class PodBase<TExportPodOpts extends ExportConfig = any> {
  public opts: PodOpts;
  private _engine: DEngine;

  constructor(opts: PodOpts) {
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

  prepareForExport(opts: ExportPodOpts<TExportPodOpts>) {
    this.initEngine();
    const nodes = this.engine[opts.mode];
    const hideBody = opts.metaOnly ? true : false;
    const payload: any = _.map(nodes, (ent) => {
      return ent.toRawProps(hideBody);
    });
    return payload;
  }
}

export type ExportConfig = {
  dest: URI;
};

export type ExportPodOpts<TConfig extends ExportConfig> = {
  /**
   * Export schema or notes
   */
  mode: "notes" | "schemas";
  /**
   * Only export metadata?
   */
  metaOnly: boolean;
  config: TConfig;
};

export interface ExportPod<TConfig extends ExportConfig> {
  plant: (opts: ExportPodOpts<TConfig>) => Promise<void>;
}

// interface ImportPod {
// }
