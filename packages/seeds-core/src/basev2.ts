import { DVault, NotePropsV2 } from "@dendronhq/common-all";
import {
  createLogger,
  DLogger,
  GitUtils,
  simpleGit,
} from "@dendronhq/common-server";
import fs from "fs-extra";
import _ from "lodash";
import path from "path";

export type SourceAttr = {
  name: string;
  url: string;
  license: string;
};

export type PlantOpts = {
  vault: DVault;
  jsonOnly?: boolean;
};

export type PrepareOpts = {
  root: string;
};

export type SeedType = "git" | "composite";
export type SeedConfig = {
  name: string;
  type: SeedType;
  src?: string;
  source?: SourceAttr;
};
export type Asset = {
  srcPath: string;
  dstPath: string;
};

type DendronSeedOpts = { wsRoot: string };
export type PrepareOutput = { notes: NotePropsV2[]; assets: Asset[] };

export abstract class DendronSeed<TConfig extends SeedConfig = SeedConfig> {
  public L: DLogger;
  public wsRoot: string;

  abstract config: TConfig;

  constructor(opts: DendronSeedOpts) {
    this.L = createLogger();
    this.wsRoot = opts.wsRoot;
  }

  get name(): string {
    return this.config.name;
  }

  get seedBuildPath(): string {
    const out = path.join(this.seedPath, "build", this.name);
    fs.ensureDirSync(out);
    return out;
  }

  get seedRepoPath(): string {
    const out = path.join(this.seedPath, "repo", this.name);
    fs.ensureDirSync(out);
    return out;
  }

  get seedPath(): string {
    const out = path.join(this.wsRoot, "seeds");
    fs.ensureDirSync(out);
    return out;
  }


  async fetch(config: TConfig): Promise<string> {
    let resp;
    switch (config.type) {
      case "git":
        resp = this.handleGit(config);
        break;
      default:
        throw Error("unsupported src type");
    }
    return resp;
  }

  async handleGit(config: TConfig) {
    const ctx = "handleGit";
    this.L.info({ ctx, config });
    const remoteUrl = config.src!;
    const repoPath = this.seedRepoPath;
    const git = simpleGit({ baseDir: repoPath });
    if (GitUtils.isRepo(repoPath)) {
      this.L.info({ ctx, msg: "repo exists" });
      await git.pull();
    } else {
      await git.clone(remoteUrl, repoPath);
    }
    return repoPath;
  }

  abstract prepare(opts: PrepareOpts): Promise<PrepareOutput>;

  async enrichNotes(notes: NotePropsV2[], opts: PlantOpts) {
    const source = this.config.source;
    if (!source) {
      return notes;
    }
    return Promise.all(
      notes.map(async (n: NotePropsV2) => {
        let sources: SourceAttr[] = n?.custom?.sources;
        n.vault = opts.vault;
        if (!n.custom) {
          n.custom = {};
        }
        if (!sources) {
          n.custom.sources = [];
          sources = n.custom.sources;
        }
        if (!_.find(sources, { url: source.url })) {
          sources.push(source);
        }
        return n;
      })
    );
  }

  async plant(opts: PlantOpts) {
    const config = this.config;
    const repoPath = await this.fetch(config);
    let { notes } = await this.prepare({ root: repoPath });
    notes = await this.enrichNotes(notes, opts);
    if (opts?.jsonOnly) {
      fs.writeJSONSync(path.join(this.seedBuildPath, "notes.json"), notes, {spaces: 4});
    }
  }
}
