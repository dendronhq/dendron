import { DendronSoil, Git } from "@dendronhq/engine-server";
import { Note } from "@dendronhq/common-all";

type FetchResp = {
  root: string;
};

export type SeedSrc = {
  type: "git";
  url: string;
};

export type SeedConfig = {
  src: SeedSrc;
};

export type PrepareOpts = FetchResp;

export abstract class DendronSeed<
  TConfig extends SeedConfig = SeedConfig
> extends DendronSoil {
  abstract config(): TConfig;

  async handleGit(config: TConfig) {
    const remoteUrl = config.src.url;
    const localUrl = this.buildDirPath(this.opts.name);
    // TODO: pull if exist
    const git = new Git({ localUrl, remoteUrl });
    if (!(await git.isRepo())) {
      await git.clone();
    }
    return { root: localUrl };
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

  abstract prepare(opts: PrepareOpts): Promise<Note[]>;

  async plant() {
    const config = this.config();
    const metadata = await this.fetch(config);
    await this.engine.init();
    const notes = await this.prepare(metadata);
    await this.writeNotes(notes);
    return;
  }

  async writeNotes(notes: Note[]) {
    return Promise.all(
      notes.map((n: Note) => {
        this.engine.write(n, {
          newNode: true,
          parentsAsStubs: true,
        });
      })
    );
  }
}
