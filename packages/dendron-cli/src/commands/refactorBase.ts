import { getAllFiles } from "@dendronhq/common-server";
import { Dirent } from "fs-extra";
import _ from "lodash";
import path from "path";
import { BaseCommand } from "./base";

export type RefactorCommandOpts = {
  dryRun?: boolean;
  exclude?: string[];
  include?: string[];
  /**
   * Perform up to limit changes
   */
  limit?: number;
  root: string;
  rule: RefactorRule;
};

export type RefactorRule = {
  name?: string;
  operation: "add" | "remove"| "title2time";
  data: any;
};

export abstract class RefactorBaseCommand<
  TFile,
  TMatchData
> extends BaseCommand<RefactorCommandOpts> {
  public props?: Required<RefactorCommandOpts>;

  abstract readFile(fpath: string): TFile;
  abstract writeFile(fpath: string, data: TFile): void;

  cleanOpts(opts: RefactorCommandOpts) {
    return _.defaults(opts, {
      include: ["*.md"],
      exclude: [],
      dryRun: false,
      limit: 9999
    });
  }

  getFiles(
    opts: Required<Pick<RefactorCommandOpts, "root" | "exclude" | "include">>
  ) {
    const allFiles = getAllFiles({
      ...opts,
      withFileTypes: true
    }) as Dirent[];
    return allFiles;
  }

  abstract matchFile(file: TFile): { isMatch: boolean; matchData?: TMatchData };
  abstract refactorFile(
    file: TFile,
    rule: RefactorRule,
    matchData?: TMatchData
  ): TFile;

  async execute(opts: RefactorCommandOpts) {
    const ctx = "execute";
    this.props = this.cleanOpts(opts);
    this.L.info({ ctx, props: this.props, msg: "enter" });
    const stats = {
      numChanged: 0
    };
    const { limit, root, rule } = this.props;
    const allFiles = this.getFiles({ ...this.props });
    // return Promise.all(
    return allFiles.map(dirent => {
      const { name: fname } = dirent;
      if (stats.numChanged > limit) {
        this.L.info(`reached limit of ${limit} changes`);
        return;
      }
      const fpath = path.join(root, fname);
      const out = this.readFile(fpath);

      // edit file
      const { isMatch, matchData } = this.matchFile(out);
      if (isMatch) {
        this.L.info({ ctx, msg: "matchFile", fname, matchData });
        if (!this.props?.dryRun) {
          const cleanFile = this.refactorFile(out, rule, matchData);
          this.writeFile(fpath, cleanFile);
        }
        stats.numChanged += 1;
      }
    });
    //);
  }
}
