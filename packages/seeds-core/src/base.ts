import { DendronSoil, Git } from "@dendronhq/engine-server";
import { Note } from "@dendronhq/common-all";
import path from "path";
import _ from "lodash";
import fs from "fs-extra";

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
export type PrepareOutput = { notes: Note[]; assets: Asset[] };

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

  async mergeNote(note: Note): Promise<Note> {
    const { mergeStrategy } = _.defaults(this.config(), {
      mergeStrategy: "appendToBottom",
    });
    const resp = await this.engine.queryOne(note.fname, "note", {
      fullNode: true,
    });
    if (!resp.data) {
      throw Error("no note found");
    }
    let body = resp.data.body;
    switch (mergeStrategy) {
      case "insertAtTop":
        body = [note.body, "\n", resp.data.body].join("\n");
        break;
      case "appendToBottom":
        body = [resp.data.body, "\n", note.body].join("\n");
        break;
      case "replace":
        body = note.body;
        break;
      default:
        throw Error(`unknown merge strategy: ${mergeStrategy}`);
    }
    resp.data.body = body;
    return resp.data as Note;
  }

  async writeAssets(assets: Asset[]) {
    return Promise.all(
      assets.map(async (ent) => {
        const src = ent.srcPath;
        const dst = ent.dstPath;
        const assetsDir = path.join(this.engine.props.root, "assets");
        return fs.copyFile(src, path.join(assetsDir, dst));
      })
    );
  }

  async writeNotes(notes: Note[]) {
    const source = this.config().source;
    return Promise.all(
      notes.map(async (n: Note) => {
        const notePath = path.join(this.engine.props.root, n.fname + ".md");
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
        this.engine.write(n, {
          newNode: true,
          parentsAsStubs: true,
        });
      })
    );
  }
}
