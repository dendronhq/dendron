import { genUUID } from "@dendronhq/common-all";
import { createLogger, getAllFiles } from "@dendronhq/common-server";
import fs, { Dirent } from "fs-extra";
import _ from "lodash";
import path from "path";
import { BaseCommand } from "./base";

const L = createLogger("dendron");

export type RefactorCommandOpts = {
  dryRun?: boolean;
  exclude?: string[];
  include?: string[];
  /**
   * Perform up to limit changes
   */
  limit?: number;
  root: string;
  rules: string[];
};

type RefactorRule = {
  name: string;
  matcher: RegExp;
  fmOnly?: boolean;
  replacer: (
    match: RegExpMatchArray | null,
    txt: string
  ) => { txtClean: string; diff: any };
  opts?: {
    matchIfNull: boolean;
  };
};

export const RULES = {
  ADD_FM_BLOCK: "ADD_FM_BLOCK",
  ADD_FM_ID: "ADD_FM_ID",
  REMOVE_FM_BRACKETS: "REMOVE_FM_BRACKETS",
};

export abstract class RefactorBaseCommand<
  TFile,
  TMatchData
> extends BaseCommand<RefactorCommandOpts> {
  public props: Required<RefactorCommandOpts>;

  constructor(name: string, opts: RefactorCommandOpts) {
    super(name);
    this.props = this.cleanOpts(opts);
  }

  abstract readFile(fpath: string): TFile;
  abstract writeFile(fpath: string, data: TFile): void;

  cleanOpts(opts: RefactorCommandOpts) {
    return _.defaults(opts, {
      include: ["*.md"],
      exclude: [],
      dryRun: false,
      limit: 9999,
    });
  }

  getFiles(
    opts: Required<Pick<RefactorCommandOpts, "root" | "exclude" | "include">>
  ) {
    const allFiles = getAllFiles({
      ...opts,
      withFileTypes: true,
    }) as Dirent[];
    return allFiles;
  }

  abstract matchFile(file: TFile): { isMatch: boolean; matchData?: TMatchData };
  abstract refactorFile(file: TFile, matchData?: TMatchData): TFile;

  async execute() {
    const ctx = "execute";
    const stats = {
      numChanged: 0,
    };
    const { limit, root } = this.props;
    const allFiles = this.getFiles({ ...this.props });
    // return Promise.all(
      return allFiles.map((dirent) => {
        const { name: fname } = dirent;
        if (stats.numChanged > limit) {
          L.info(`reached limit of ${limit} changes`);
          return;
        }
        const fpath = path.join(root, fname);
        const out = this.readFile(fpath);
        const { isMatch, matchData } = this.matchFile(out);
        if (isMatch) {
          this.L.info({ ctx, msg: "matchFile", fname, matchData });
          if (!this.props.dryRun) {
            const cleanFile = this.refactorFile(out, matchData);
            this.writeFile(fpath, cleanFile);
          }
          stats.numChanged += 1;
        }
      })
    //);
  }
}

export class RefactorCommand extends BaseCommand<RefactorCommandOpts> {
  public rules: { [key: string]: RefactorRule };

  constructor() {
    super();
    this.rules = {};
    this._registerRules();
  }

  getFiles(
    opts: Required<Pick<RefactorCommandOpts, "root" | "exclude" | "include">>
  ) {
    const allFiles = getAllFiles({
      ...opts,
      withFileTypes: true,
    }) as Dirent[];
    return allFiles;
  }

  _registerRules() {
    const rules = [
      {
        name: RULES.ADD_FM_BLOCK,
        matcher: /^---/,
        replacer: (_match: RegExpMatchArray | null, txt: string) => {
          const fm = "---\n\n---\n";
          const output = [fm, txt];
          return { txtClean: output.join("\n"), diff: {} };
        },
        opts: {
          matchIfNull: true,
        },
      },
      {
        name: RULES.ADD_FM_ID,
        matcher: /^---\n(?!.*id:.*)(?<fm>.*)^---\n(?<body>.*)/ms,
        replacer: (match: RegExpMatchArray | null, _txt: string) => {
          const fmOrig: string | undefined = (match?.groups ?? {}).fm;
          const body: string | undefined = (match?.groups ?? {}).body;
          const output = ["---", `id: ${genUUID()}\n${fmOrig}`, "---", body];
          return { txtClean: output.join("\n"), diff: {} };
        },
      },
      {
        name: RULES.REMOVE_FM_BRACKETS,
        fmOnly: true,
        matcher: /^(?=.*\s*-\s*\[.*)/ms,
        replacer: (match: RegExpMatchArray | null, _txt: string) => {
          const fmOrig: string | undefined = (match?.groups ?? {}).fm;
          const body: string | undefined = (match?.groups ?? {}).body;
          const fmClean = fmOrig.replace(/\[|/g, "").replace(/\]/g, ": ");
          const output = ["---", fmClean, "---", body];
          return {
            txtClean: output.join("\n"),
            fmOrig,
            fmClean,
            diff: {},
          };
        },
      },
    ];
    rules.forEach((r) => {
      this.rules[r.name] = r;
    });
  }

  applyMatch(txt: string, rule: RefactorRule) {
    const { matcher, replacer, opts } = rule;
    const match = txt.match(matcher);
    const ruleOpts = _.defaults(opts, { matchIfNull: false });
    if (
      (!_.isNull(match) && !ruleOpts.matchIfNull) ||
      (_.isNull(match) && ruleOpts.matchIfNull)
    ) {
      return replacer(match, txt);
    }
    return null;
  }

  async execute(opts: RefactorCommandOpts) {
    const { root, dryRun, exclude, include, limit, rules } = _.defaults(opts, {
      include: ["*.md"],
      exclude: [],
      dryRun: false,
      limit: 9999,
    });
    const stats = {
      numChanged: 0,
    };
    const allFiles = this.getFiles({ root, exclude, include });
    allFiles.forEach((dirent) => {
      const { name: fname } = dirent;

      if (stats.numChanged > limit) {
        L.info(`reached limit of ${limit} changes`);
        process.exit(0);
      }

      const txt = fs.readFileSync(path.join(root, fname), "utf8");
      let matchTxt: string = "";
      let restTxt: string = "";
      L.debug({ ctx: "execute:process", fname });
      rules.forEach((_r) => {
        const r = this.rules[_r];
        if (r.fmOnly) {
          const startIndex = txt.indexOf("---") + 3;
          const endIndex = txt.indexOf("---", startIndex);
          matchTxt = _.trim(txt.slice(startIndex, endIndex - 3));
          restTxt = txt.slice(endIndex + 3);
        } else {
          matchTxt = txt;
        }
        const matched = this.applyMatch(matchTxt, r);
        if (matched) {
          stats.numChanged += 1;
          const { txtClean, diff } = matched;
          const dstPath = path.join(root, fname);
          L.debug({
            ctx: "writeFileSync:pre",
            diff,
            fname,
            txtClean,
          });
          if (!dryRun) {
            fs.writeFileSync(dstPath, txtClean + restTxt);
          }
        }
      });
    });
    L.info({ ctx: "execute:exit", stats });
  }
}

async function main() {
  const root = process.argv[2];
  await new RefactorCommand().execute({
    root,
    rules: [RULES.REMOVE_FM_BRACKETS],
    // include: ['cli.pbcopy.md'],
    dryRun: false,
    // dryRun: true,
    limit: 10,
  });
  L.info("done");
  //   const store = createStorage();
  //   const resp = await store.query({ username: 'kevin' }, '**/*', {});
  //   console.log({ resp });
}

console.log("start");
main();
