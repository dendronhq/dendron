import {
  DendronSiteConfig,
  DEngine,
  DEngineClientV2,
  DNodeUtils,
  DNodeUtilsV2,
  HierarchyConfig,
  Note,
  NotePropsV2,
  NoteUtilsV2,
} from "@dendronhq/common-all";
import { resolvePath, tmpDir } from "@dendronhq/common-server";
import {
  DConfig,
  DendronEngine,
  DendronEngineClient,
  dendronNoteRefPlugin,
  getProcessor,
  ParserUtilsV2,
  replaceRefs,
  stripLocalOnlyTags,
  toc,
} from "@dendronhq/engine-server";
import fs from "fs-extra";
import matter from "gray-matter";
import _ from "lodash";
import path from "path";
import Rsync from "rsync";
import yargs from "yargs";
import { SoilCommand, SoilCommandCLIOpts, SoilCommandOpts } from "./soil";

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

function getRoot(engine: DEngine | DEngineClientV2) {
  if (engine instanceof DendronEngineClient) {
    return engine.vaults[0];
  } else {
    return (engine as DendronEngine).props.root;
  }
}

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

function stripSiteOnlyTags(body: string) {
  const re = new RegExp(/(?<raw><!--SITE_ONLY(?<body>.*)-->)/, "ms");
  let matches;
  let doc = body;
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

type Jekyll2MdFileErrors = {
  source: string;
  links: string[];
};

async function note2JekyllMdFile(
  note: Note | NotePropsV2,
  opts: {
    notesDir: string;
    engine: DEngine | DEngineClientV2;
    v2?: boolean;
  } & DendronSiteConfig
): Promise<Jekyll2MdFileErrors[]> {
  let meta: NotePropsV2;
  if (note instanceof Note) {
    meta = DNodeUtils.getMeta(note, {
      pullCustomUp: true,
      ignoreNullParent: true,
    });
  } else {
    meta = {
      ...NoteUtilsV2.serializeMeta(note),
      fname: note.fname,
    };
  }
  const jekyllProps: DendronJekyllProps = {
    hpath: note.fname,
  };
  const config: Partial<DendronSiteConfig> = opts.config || {};
  const domainPath = DNodeUtilsV2.domainName(note.fname);
  let hConfig: HierarchyConfig = _.get(config, domainPath, {
    publishByDefault: true,
    noindexByDefault: false,
  });
  const siteNotesDir = config.siteNotesDir || "notes";

  if (!hConfig.publishByDefault && !note.custom.published) {
    return [];
  }

  // root page should have '/ permalinik
  let linkPrefix = "";
  if (opts.siteIndex === meta.fname) {
    jekyllProps["permalink"] = "/";
    linkPrefix = path.basename(siteNotesDir) + "/";
  }
  let parentFname =
    note instanceof Note
      ? note.parent?.fname
      : NoteUtilsV2.getNoteByFname(
          note.fname,
          (opts.engine as DendronEngineClient).notes
        )?.fname;

  // pull children of root to the top
  if (parentFname === opts.siteIndex) {
    meta["parent"] = null;
  }
  if (hConfig.noindexByDefault && _.isUndefined(note.custom.noindex)) {
    // @ts-ignore
    meta.noindex = true;
  }

  // delete parent from root
  note.body = stripSiteOnlyTags(note.body);
  // delete content that is not meant to be published
  note.body = stripLocalOnlyTags(note.body);
  const scratchPad1Dir = tmpDir();
  const scratchPad2Dir = tmpDir();
  const scratchPad1 = path.join(scratchPad1Dir.name, "scratch.txt");
  const scratchPad2 = path.join(scratchPad2Dir.name, "scratch.txt");
  const root = getRoot(opts.engine);
  try {
    // convert links in the page

    let proc;
    if (opts.v2) {
      proc = ParserUtilsV2.getRemark().use(dendronNoteRefPlugin, {
        renderWithOutline: opts.usePrettyRefs || false,
        replaceRefOpts: {
          wikiLink2Md: true,
          wikiLinkPrefix: linkPrefix,
          imageRefPrefix: opts.assetsPrefix,
          wikiLinkUseId: true,
          engine: opts.engine,
          scratch: scratchPad1,
          forNoteRefInSite: true,
        },
        engine: opts.engine as DEngineClientV2,
      });
    } else {
      proc = getProcessor({
        root,
        renderWithOutline: opts.usePrettyRefs,
        // necessary when when finding refs
        replaceRefs: {
          wikiLink2Md: true,
          wikiLinkPrefix: linkPrefix,
          imageRefPrefix: opts.assetsPrefix,
          wikiLinkUseId: true,
          engine: opts.engine,
          scratch: scratchPad1,
          forNoteRefInSite: true,
        },
      });
    }

    proc = proc.use(replaceRefs, {
      wikiLink2Md: true,
      wikiLinkPrefix: linkPrefix,
      imageRefPrefix: opts.assetsPrefix,
      wikiLinkUseId: true,
      engine: opts.engine,
      scratch: scratchPad2,
      forNoteRefInSite: true,
    });

    if (note?.custom?.toc) {
      proc = proc.use(toc);
    }

    // replaces wiki-links with the markdown equivalent
    note.body = proc.processSync(note.body).toString();
  } catch (err) {
    console.log(err);
    throw err;
  }
  const filePath = path.join(opts.notesDir, meta.id + ".md");
  await fs.writeFile(
    filePath,
    matter.stringify(note.body || "", { ...meta, ...jekyllProps })
  );
  const errors: Jekyll2MdFileErrors[] = [];
  await Promise.all(
    [scratchPad1Dir, scratchPad2Dir].map(async (ent) => {
      const scratchFile = path.join(ent.name, "scratch.txt");
      if (fs.existsSync(scratchFile)) {
        const sc = fs.readFileSync(scratchFile, { encoding: "utf8" });
        errors.push({
          source: note.fname,
          links: _.reject(sc.split("\n"), _.isEmpty),
        });
        await fs.emptyDir(ent.name);
      }
      ent.removeCallback();
    })
  );
  return errors;
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
  }): Promise<Jekyll2MdFileErrors[]> {
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
    let writeStubsQ: any = [];

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
    await Promise.all(writeStubsQ);
    const errors = await Promise.all(out);
    return _.flatten(errors);
  }

  async doBuildV2(opts: {
    engineClient: DEngineClientV2;
    config: DendronSiteConfig;
    writeStubs: boolean;
    notesDir: string;
  }): Promise<Jekyll2MdFileErrors[]> {
    const { engineClient, config, writeStubs, notesDir } = opts;
    const { siteHierarchies } = config;

    let navOrder = 0;
    const nodes: NotePropsV2[] = siteHierarchies.map((fname) => {
      const note = NoteUtilsV2.getNoteByFname(fname, engineClient.notes, {
        throwIfEmpty: true,
      }) as NotePropsV2;
      if (!note.custom) {
        note.custom = {};
      }
      note.custom.nav_order = navOrder;
      note.parent = null;
      note.title = _.capitalize(note.title);
      navOrder += 1;
      return note;
    });
    const out = [];
    let writeStubsQ: any = [];

    // get rest of hieararchy
    while (!_.isEmpty(nodes)) {
      const node = nodes.pop() as NotePropsV2;
      out.push(
        note2JekyllMdFile(node, {
          v2: true,
          notesDir,
          engine: engineClient,
          ...config,
        })
      );
      node.children.forEach((n) => nodes.push(engineClient.notes[n]));
      if (writeStubs && node.stub) {
        node.stub = false;
        writeStubsQ.push(
          engineClient.writeNote(node, { writeHierarchy: true })
        );
      }
    }
    await Promise.all(writeStubsQ);
    const errors = await Promise.all(out);
    return _.flatten(errors);
  }

  async execute(opts: CommandOpts) {
    let {
      engine,
      config,
      wsRoot,
      writeStubs,
      incremental,
      engineClient,
    } = _.defaults(opts, {
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
    let errors: Jekyll2MdFileErrors[];

    if (incremental) {
      const staging = tmpDir();
      if (engineClient) {
        errors = await this.doBuildV2({
          engineClient,
          config,
          writeStubs,
          notesDir: staging.name,
        });
      } else {
        errors = await this.doBuild({
          engine,
          config,
          writeStubs,
          notesDir: staging.name,
        });
      }
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
      if (engineClient) {
        errors = await this.doBuildV2({
          engineClient,
          config,
          writeStubs,
          notesDir: siteNotesDirPath,
        });
      } else {
        errors = await this.doBuild({
          engine,
          config,
          writeStubs,
          notesDir: siteNotesDirPath,
        });
      }
    }

    // move assets
    this.L.info({ ctx, msg: "copy assets..." });
    const assetsDir = "assets";
    const vaultAssetsDir = path.join(
      getRoot(engineClient || engine),
      assetsDir
    );
    const siteAssetsDir = path.join(siteRootPath, assetsDir);
    if (config.copyAssets !== false) {
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
      errors,
    };
  }
}
