import {
  DendronSiteConfig,
  DEngine,
  DNodeUtils,
  Note,
  HierarchyConfig,
} from "@dendronhq/common-all";
import { resolvePath } from "@dendronhq/common-server";
import fs from "fs-extra";
import matter from "gray-matter";
import _ from "lodash";
import path from "path";
import { BaseCommand } from "./base";
import {
  stripLocalOnlyTags,
  getProcessor,
  replaceRefs,
} from "@dendronhq/engine-server";
import Rsync from "rsync";

type CommandOpts = {
  engine: DEngine;
  config: DendronSiteConfig;
} & CommandCommonOpts;

type CommandCommonOpts = {
  dendronRoot: string;
};

type CommandOutput = void;

type DendronJekyllProps = {
  hpath: string;
  permalink?: string;
};

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
  const config = opts.config || {};
  let hConfig: HierarchyConfig = _.get(config, note.domain.fname, {
    publishByDefault: true,
  });

  if (!hConfig.publishByDefault && !note.custom.published) {
    return;
  }

  let linkPrefix = "";
  if (opts.siteIndex === meta.fname) {
    jekyllProps["permalink"] = "/";
    linkPrefix = path.basename(opts.notesDir) + "/";
  }
  // pull children of root to the top
  if (note.parent?.fname === opts.noteRoot) {
    delete meta["parent"];
  }
  // delete parent from root
  note.body = stripSiteOnlyTags(note);
  note.body = stripLocalOnlyTags(note.body);
  note.body = getProcessor()
    .use(replaceRefs, {
      wikiLink2Md: true,
      wikiLinkPrefix: linkPrefix,
      imageRefPrefix: opts.assetsPrefix,
      wikiLinkUseId: true,
      engine: opts.engine,
    })
    .processSync(note.body)
    .toString();
  const filePath = path.join(opts.notesDir, meta.id + ".md");
  return fs.writeFile(
    filePath,
    matter.stringify(note.body || "", { ...meta, ...jekyllProps })
  );
}

export class BuildSiteCommand extends BaseCommand<CommandOpts, CommandOutput> {
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
        }
        this.L.info({ msg: "finish copying" });
        resolve();
      });
    });
  }

  async execute(opts: CommandOpts) {
    const { engine, config, dendronRoot } = _.defaults(opts, {});
    const ctx = "BuildSiteCommand";
    let {
      siteRoot,
      noteRoot,
      siteRootDir,
      siteHierarchies,
      noteRoots,
      siteIndex,
    } = config;
    siteRootDir = siteRootDir || siteRoot;
    if (!siteRootDir) {
      throw `siteRootDir is undefined`;
    }
    siteHierarchies = (siteHierarchies || noteRoots || [noteRoot]) as string[];
    if (siteHierarchies.length < 1) {
      throw `siteHiearchies must have at least one hiearchy`;
    }
    // update site index
    config.siteIndex = siteIndex || noteRoot || siteHierarchies[0];
    this.L.info({ ctx, siteHierarchies, config });

    // setup path to site
    const siteRootPath = resolvePath(siteRootDir, dendronRoot);
    const siteNotesDir = "notes";
    const siteNotesDirPath = path.join(siteRootPath, siteNotesDir);
    this.L.info({ msg: "enter", siteNotesDirPath });
    fs.ensureDirSync(siteNotesDirPath);
    fs.emptyDirSync(siteNotesDirPath);

    // get hieararchy domains
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

    // get rest of hieararchy
    while (!_.isEmpty(nodes)) {
      const node = nodes.pop() as Note;
      out.push(
        note2JekyllMdFile(node, {
          notesDir: siteNotesDirPath,
          engine,
          ...config,
        })
      );
      node.children.forEach((n) => nodes.push(n as Note));
    }

    // move assets
    const assetsDir = "assets";
    const vaultAssetsDir = path.join(engine.props.root, assetsDir);
    const siteAssetsDir = path.join(siteRootPath, assetsDir);
    if (!config.assetsPrefix) {
      await this.copyAssets({ vaultAssetsDir, siteAssetsDir });
    }

    await Promise.all(out);
    this.L.info({ msg: "exit" });
    return;
  }
}

export type BuildSiteCliOpts = {
  vault: string;
} & CommandCommonOpts;

// rm -r site-builder/docs 2>/dev/null || true
// mkdir site-builder/docs
// echo "copying files..."
// cp vault/* site-builder/docs
