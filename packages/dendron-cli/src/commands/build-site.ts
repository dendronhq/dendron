import {
  DendronSiteConfig,
  DEngine,
  DNodeUtils,
  Note,
  HierarchyConfig,
} from "@dendronhq/common-all";
import { resolvePath, tmpDir } from "@dendronhq/common-server";
import fs from "fs-extra";
import matter from "gray-matter";
import _ from "lodash";
import path from "path";
import {
  stripLocalOnlyTags,
  getProcessor,
  replaceRefs,
  DConfig,
} from "@dendronhq/engine-server";
import Rsync from "rsync";
import { SoilCommand, SoilCommandCLIOpts, SoilCommandOpts } from "./soil";
import yargs from "yargs";

type CommandOutput = {
  buildNotesRoot: string;
};

type CommandCLIOpts = SoilCommandCLIOpts & {
  writeStubs?: boolean;
  incremental?: boolean;
  dryRun?: boolean;
};

export { CommandCLIOpts as BuildSiteCommandCLIOpts };

type CommandOpts = SoilCommandOpts & {
  config: DendronSiteConfig;
  writeStubs: boolean;
  incremental?: boolean;
  dryRun?: boolean;
};

type DendronJekyllProps = {
  hpath: string;
  permalink?: string;
};

function rsyncCopy(src: string, dst: string) {
  // rsync -a --no-times --size-only /tmp/notes/* docs/notes
  return new Promise((resolve, reject) => {
    const rsync = new Rsync()
      .flags("a")
      .set("no-times")
      .set("size-only")
      .delete()
      .source(src)
      .destination(dst);
    console.log(rsync.command());
    rsync.execute((err, code, cmd) => {
      if (err) {
        err.message += JSON.stringify({
          code,
          cmd,
          src,
          dst,
        });
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

function stripSiteOnlyTags(note: Note) {
  const re = new RegExp(/(?<raw><!--SITE_ONLY(?<body>.*)-->)/, "ms");
  let matches;
  let doc = note.body;
  do {
    matches = doc.match(re);
    if (matches) {
      // @ts-ignore
      const { raw, body } = matches.groups;
      doc = doc.replace(raw, body);
    }
  } while (matches);
  return doc;
}

async function note2JekyllMdFile(
  note: Note,
  opts: { notesDir: string; engine: DEngine } & DendronSiteConfig
): Promise<void> {
  const meta = DNodeUtils.getMeta(note, {
    pullCustomUp: true,
    ignoreNullParent: true,
  });
  const jekyllProps: DendronJekyllProps = {
    hpath: note.path,
  };
  const config: Partial<DendronSiteConfig> = opts.config || {};
  let hConfig: HierarchyConfig = _.get(config, note.domain.fname, {
    publishByDefault: true,
    noindexByDefault: false,
  });
  const siteNotesDir = config.siteNotesDir || "notes";

  if (!hConfig.publishByDefault && !note.custom.published) {
    return;
  }

  // root page should have '/ permalinik
  let linkPrefix = "";
  if (opts.siteIndex === meta.fname) {
    jekyllProps["permalink"] = "/";
    linkPrefix = path.basename(siteNotesDir) + "/";
  }
  // pull children of root to the top
  if (note.parent?.fname === opts.siteIndex) {
    // @ts-ignore
    delete meta["parent"];
  }
  if (hConfig.noindexByDefault && _.isUndefined(note.custom.noindex)) {
    meta.noindex = true;
  }

  // delete parent from root
  note.body = stripSiteOnlyTags(note);
  note.body = stripLocalOnlyTags(note.body);
  try {
    note.body = getProcessor({
      root: opts.engine.props.root,
      renderWithOutline: opts.usePrettyRefs,
      // necessary when when finding refs
      replaceRefs: {
        wikiLink2Md: true,
        wikiLinkPrefix: linkPrefix,
        imageRefPrefix: opts.assetsPrefix,
        wikiLinkUseId: true,
        engine: opts.engine,
      },
    })
      .use(replaceRefs, {
        wikiLink2Md: true,
        wikiLinkPrefix: linkPrefix,
        imageRefPrefix: opts.assetsPrefix,
        wikiLinkUseId: true,
        engine: opts.engine,
      })
      .processSync(note.body)
      .toString();
  } catch (err) {
    console.log(err);
  }
  const filePath = path.join(opts.notesDir, meta.id + ".md");
  return fs.writeFile(
    filePath,
    matter.stringify(note.body || "", { ...meta, ...jekyllProps })
  );
}

export class BuildSiteCommand extends SoilCommand<
  CommandCLIOpts,
  CommandOpts,
  CommandOutput
> {
  buildArgs(args: yargs.Argv) {
    super.buildArgs(args);
    args.option("writeStubs", {
      describe: "writeStubs",
      default: true,
    });
    args.option("incremental", {
      describe: "use rsync to only copy files that changed",
      default: false,
      type: "boolean",
    });
    args.option("dryRun", {
      describe: "don't actually build",
      default: false,
      type: "boolean",
    });
  }

  enrichArgs(args: CommandCLIOpts) {
    const args1 = super._enrichArgs(args);
    const config = DConfig.getOrCreate(args.wsRoot).site;
    return { ...args1, config, writeStubs: args.writeStubs || false };
  }

  static buildCmd(yargs: yargs.Argv): yargs.Argv {
    const _cmd = new BuildSiteCommand();
    return yargs.command(
      "buildSite",
      "build notes for publication",
      _cmd.buildArgs,
      _cmd.eval
    );
  }

  async copyAssetsFallback(opts: {
    vaultAssetsDir: string;
    siteAssetsDir: string;
  }) {
    const { vaultAssetsDir, siteAssetsDir } = opts;
    if (!fs.existsSync(path.join(vaultAssetsDir, "images"))) {
      return;
    }
    return new Promise((resolve, reject) => {
      fs.copy(
        path.join(vaultAssetsDir, "images"),
        path.join(siteAssetsDir, "images"),
        (err) => {
          if (err) {
            err.message += JSON.stringify({ vaultAssetsDir, siteAssetsDir });
            reject(err);
          }
          this.L.info({ msg: "finish copying" });
          resolve();
        }
      );
    });
  }

  async copyAssets(opts: { vaultAssetsDir: string; siteAssetsDir: string }) {
    const { vaultAssetsDir, siteAssetsDir } = opts;

    if (!fs.existsSync(path.join(vaultAssetsDir, "images"))) {
      return;
    }
    const src = path.join(vaultAssetsDir, "images");
    const dst = path.join(siteAssetsDir);
    const rsync = new Rsync().flags("az").delete().source(src).destination(dst);

    return new Promise((resolve, reject) => {
      rsync.execute((err, code, cmd) => {
        if (err) {
          err.message += JSON.stringify({
            code,
            cmd,
            vaultAssetsDir,
            siteAssetsDir,
          });
          reject(err);
        } else {
          this.L.info({ msg: "finish copying" });
          resolve();
        }
      });
    });
  }

  async doBuild(opts: {
    engine: DEngine;
    config: DendronSiteConfig;
    writeStubs: boolean;
    notesDir: string;
  }) {
    const { engine, config, writeStubs, notesDir } = opts;
    const { siteHierarchies } = config;

    let navOrder = 0;
    const nodes: Note[] = siteHierarchies.map((fname) => {
      const note = DNodeUtils.getNoteByFname(fname, engine, {
        throwIfEmpty: true,
      }) as Note;
      note.custom.nav_order = navOrder;
      note.parent = null;
      note.title = _.capitalize(note.title);
      navOrder += 1;
      return note;
    });
    const out = [];
    let writeStubsQ = [];

    // get rest of hieararchy
    while (!_.isEmpty(nodes)) {
      const node = nodes.pop() as Note;
      out.push(
        note2JekyllMdFile(node, {
          notesDir,
          engine,
          ...config,
        })
      );
      node.children.forEach((n) => nodes.push(n as Note));
      if (writeStubs && node.stub) {
        node.stub = false;
        writeStubsQ.push(engine.write(node, { stub: false }));
      }
    }
    await Promise.all(writeStubsQ.concat(out));
  }

  async execute(opts: CommandOpts) {
    let { engine, config, wsRoot, writeStubs, incremental } = _.defaults(opts, {
      incremental: false,
    });
    const ctx = "BuildSiteCommand";
    config = DConfig.cleanSiteConfig(config);
    this.L.info({ ctx, config, incremental });

    // setup path to site
    const siteRootPath = resolvePath(config.siteRootDir, wsRoot);
    const siteNotesDir = "notes";
    const siteNotesDirPath = path.join(siteRootPath, siteNotesDir);
    this.L.info({ msg: "enter", siteNotesDirPath });
    fs.ensureDirSync(siteNotesDirPath);

    if (incremental) {
      const staging = tmpDir();
      await this.doBuild({
        engine,
        config,
        writeStubs,
        notesDir: staging.name,
      });
      this.L.info({
        ctx,
        msg: "rsync",
        src: staging.name,
        dest: siteNotesDirPath,
      });
      if (!opts.dryRun) {
        await rsyncCopy(`${path.join(staging.name, "*")}`, siteNotesDirPath);
        fs.emptyDirSync(staging.name);
        staging.removeCallback();
      }
    } else {
      fs.emptyDirSync(siteNotesDirPath);
      await this.doBuild({
        engine,
        config,
        writeStubs,
        notesDir: siteNotesDirPath,
      });
    }

    // move assets
    this.L.info({ ctx, msg: "copy assets..." });
    const assetsDir = "assets";
    const vaultAssetsDir = path.join(engine.props.root, assetsDir);
    const siteAssetsDir = path.join(siteRootPath, assetsDir);
    if (!config.assetsPrefix) {
      try {
        await this.copyAssets({ vaultAssetsDir, siteAssetsDir });
      } catch (err) {
        // this.L.error({ err, msg: "error copying assets" });
        await this.copyAssetsFallback({ vaultAssetsDir, siteAssetsDir });
        this.L.info({ msg: "use copy fallback" });
      }
    }

    this.L.info({ msg: "exit" });
    return {
      buildNotesRoot: siteRootPath,
    };
  }
}
