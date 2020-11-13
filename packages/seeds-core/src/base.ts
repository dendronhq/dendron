import {
  createLogger,
  DEngineClientV2,
  NotePropsV2,
} from "@dendronhq/common-all";
import { DendronEngineV2, Git } from "@dendronhq/engine-server";
import fs from "fs-extra";
import _ from "lodash";
import path from "path";

type FetchResp = {
  root: string;
};

export type SeedSrc = {
  type: "git";
  url: string;
};

export type SeedConfig = {
  src: SeedSrc;
  mergeStrategy?: "insertAtTop" | "replace" | "appendToBottom";
  source: {
    name?: string;
    url: string;
    license: string;
  };
};

export type SourceAttr = {
  name?: string;
  url: string;
  license: string;
};

export type PrepareOpts = FetchResp;
export type Asset = {
  srcPath: string;
  dstPath: string;
};
export type PrepareOutput = { notes: NotePropsV2[]; assets: Asset[] };

type DendronSoilOpts = {
  name: string;
  wsRoot: string;
  engine?: DEngineClientV2;
  roots: string[];
};

export abstract class DendronSoil {
  public opts: DendronSoilOpts;
  public L: any;
  public engine: DEngineClientV2;

  buildDirPath(customDir?: string): string {
    const root = this.opts.wsRoot;
    let buildDirComp = [root, "build"];
    if (customDir) {
      buildDirComp.push(customDir);
    }
    const buildDirPath = path.join(...buildDirComp);
    fs.ensureDirSync(buildDirPath);
    return buildDirPath;
  }

  constructor(opts: DendronSoilOpts) {
    this.opts = opts;
    //@ts-ignore
    this.L = createLogger(opts.name);
    if (!_.isUndefined(this.opts.engine)) {
      this.engine = this.opts.engine;
    } else {
      this.engine = DendronEngineV2.create({ vaults: this.opts.roots });
    }
  }
}

export abstract class DendronSeed<
  TConfig extends SeedConfig = SeedConfig
> extends DendronSoil {
  abstract config(): TConfig;

  async handleGit(config: TConfig) {
    const ctx = "handleGit";
    this.L.info({ ctx, config });
    const remoteUrl = config.src.url;
    const localUrl = this.buildDirPath(this.opts.name);
    const repoPath = path.join(localUrl, "repo");

    const git = new Git({ localUrl, remoteUrl });
    const isRepo = await Git.getRepo(repoPath);
    if (!isRepo) {
      this.L.info({ ctx, msg: "cloning" });
      await git.clone("repo");
    }
    this.L.info({ ctx, localUrl, remoteUrl, msg: "exit" });
    return { root: repoPath };
  }

  async fetch(config: TConfig): Promise<FetchResp> {
    let resp;
    switch (config.src.type) {
      case "git":
        resp = this.handleGit(config);
        break;
      default:
        throw Error("unsupported src type");
    }
    return resp;
  }

  abstract prepare(opts: PrepareOpts): Promise<PrepareOutput>;

  async plant() {
    const config = this.config();
    const metadata = await this.fetch(config);
    await this.engine.init();
    const { notes, assets } = await this.prepare(metadata);
    await this.writeAssets(assets);
    await this.writeNotes(notes);
    return;
  }

  async mergeNote(note: NotePropsV2): Promise<NotePropsV2> {
    const { mergeStrategy } = _.defaults(this.config(), {
      mergeStrategy: "appendToBottom",
    });
    const resp = await this.engine.getNoteByPath({
      npath: note.fname,
      vault: note.vault,
    });
    if (!resp.data) {
      throw Error("no note found");
    }
    let noteFromEngine = resp.data.note as NotePropsV2;
    let body = noteFromEngine.body;
    switch (mergeStrategy) {
      case "insertAtTop":
        body = [note.body, "\n", body].join("\n");
        break;
      case "appendToBottom":
        body = [body, "\n", note.body].join("\n");
        break;
      case "replace":
        body = note.body;
        break;
      default:
        throw Error(`unknown merge strategy: ${mergeStrategy}`);
    }
    noteFromEngine.body = body;
    return noteFromEngine;
  }

  async writeAssets(assets: Asset[]) {
    return Promise.all(
      assets.map(async (ent) => {
        const src = ent.srcPath;
        const dst = ent.dstPath;
        const assetsDir = path.join(this.engine.vaults[0], "assets");
        return fs.copyFile(src, path.join(assetsDir, dst));
      })
    );
  }

  async writeNotes(notes: NotePropsV2[]) {
    const source = this.config().source;
    return Promise.all(
      notes.map(async (n: NotePropsV2) => {
        const notePath = path.join(this.engine.vaults[0], n.fname + ".md");
        if (fs.existsSync(notePath)) {
          n = await this.mergeNote(n);
        }
        let sources: SourceAttr[] = n.custom.sources;
        if (!sources) {
          n.custom.sources = [];
          sources = n.custom.sources;
        }
        if (!_.find(sources, { url: source.url })) {
          sources.push(source);
        }
        this.engine.writeNote(n, {
          newNode: true,
        });
      })
    );
  }
}
