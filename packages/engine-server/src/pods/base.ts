import { DEngine } from "@dendronhq/common-all";
import _ from "lodash";
import { createLogger } from "@dendronhq/common-server";

export type PodOptEntry = {
  name: string;
  required: boolean;
  description?: string;
  type: "string";
};
export type PodOpts = PodOptEntry[];

export interface Pod<TImportOpts = any> {
  /**
   * Fetch pod from remote
   */
  fetch: () => Promise<void>;
  /**
   * Convert to dendron
   */
  import: (opts: TImportOpts) => Promise<any>;
}

export interface PodClass {
  id: string;
  description: string;
  importOpts: PodOpts;
  new (opts: PodConsOpts): Pod;
}

export type PodConsOpts = {
  engine: DEngine;
};

export abstract class BasePod<TImportOpts = any> implements Pod<TImportOpts> {
  public L: ReturnType<typeof createLogger>;

  // static id= (): string => {
  //   throw Error("not implemented")
  // }

  protected engine: DEngine;

  constructor(opts: PodConsOpts) {
    this.L = createLogger("PodCommand");
    this.engine = opts.engine;
  }

  abstract async fetch(): Promise<void>;

  abstract async handleImport(opts: TImportOpts): Promise<any>;

  async sanityCheck(): Promise<undefined | string> {
    return;
  }

  async import(opts: TImportOpts): Promise<{ error: any[] }> {
    const out = await this.sanityCheck();
    if (!_.isUndefined(out)) {
      return {
        error: [out],
      };
    }
    await this.handleImport(opts);
    return { error: [] };
  }
}
