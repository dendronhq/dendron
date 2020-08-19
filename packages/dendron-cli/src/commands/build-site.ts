import {
  DendronSiteConfig,
  DEngine,
  DNodeUtils,
  Note,
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

function note2JekyllMdFile(
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
  let linkPrefix = "";
  if (opts.noteRoot === meta.fname) {
    jekyllProps["permalink"] = "/";
    linkPrefix = path.basename(opts.notesDir);
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

  async execute(opts: CommandOpts) {
    const { engine, config, dendronRoot } = _.defaults(opts, {});
    const { siteRoot: siteRootRaw, noteRoot } = config;

    const siteRoot = resolvePath(siteRootRaw, dendronRoot);
    const siteNotesDir = "notes";
    const siteNotesDirPath = path.join(siteRoot, siteNotesDir);
    const L = this.L;
    // ({
    //   ctx: "BuildSiteComman",
    //   siteRoot,
    //   dendronRoot,
    //   noteRoot
    // });
    L.info({ msg: "enter", siteNotesDirPath });
    fs.ensureDirSync(siteNotesDirPath);
    fs.emptyDirSync(siteNotesDirPath);

    const root: Note = _.find(engine.notes, { fname: noteRoot }) as Note;
    if (_.isUndefined(root)) {
      throw Error(`root ${root} not found`);
    }
    let navOrder = 0;
    const nodes: Note[] = config.noteRoots
      ? config.noteRoots.map((fname) => {
          const note = DNodeUtils.getNoteByFname(fname, engine, {
            throwIfEmpty: true,
          }) as Note;
          note.custom.nav_order = navOrder;
          note.parent = null;
          note.title = _.capitalize(note.title);
          navOrder += 1;
          return note;
        })
      : [root];
    const out = [];

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

    // TODO: need to rewrite links before this is ready
    const assetsDir = "assets";
    // notes/assets
    //const noteAssetsDir = path.join(siteNotesDirPath, assetsDir);
    const vaultAssetsDir = path.join(engine.props.root, assetsDir);
    // docs/assets
    const siteAssetsDir = path.join(siteRoot, assetsDir);
    if (!config.assetsPrefix) {
      await this.copyAssets({ vaultAssetsDir, siteAssetsDir });
    }

    await Promise.all(out);
    L.info({ msg: "exit" });
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
