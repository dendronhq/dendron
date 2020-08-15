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

function wikiLinkToMd(
  note: Note,
  engine: DEngine,
  opts?: { linkPrefix: string }
) {
  let matches;
  let doc = note.body;
  do {
    matches = doc.match(/(?<raw>\[\[(?<link>[^\]]+)\]\])/);
    if (matches) {
      // @ts-ignore
      const { raw, link } = matches.groups;
      const [first, rest] = link.split("|");
      let title: string | undefined;
      let mdLink: string;
      // we have a piped title
      if (rest) {
        title = _.trim(first);
        mdLink = _.trim(rest);
      } else {
        mdLink = _.trim(first);
      }
      const noteFromLink = _.find(engine.notes, { fname: mdLink });
      if (!noteFromLink) {
        throw Error(`${mdLink} not found. file: ${note.fname}`);
      }
      if (!title) {
        title = _.trim(noteFromLink.title);
      }
      let noteLink = noteFromLink.id;
      if (opts?.linkPrefix) {
        noteLink = `${opts.linkPrefix}/${noteLink}`;
      }
      const newLink = `[${title}](${noteLink})`;
      doc = doc.replace(raw, newLink);
    }
  } while (matches);
  return doc;
}

// @ts-ignore
function imageLinkConverter(note: Note) {
  let matches;
  let doc = note.body;
  do {
    matches = doc.match(/(\(?<link>assets\/images[^)]+\))/);
    if (matches) {
      // @ts-ignore
      const { link } = matches.groups;
      const linkReplace = link.replace("(assets", "(/assets");
      doc = doc.replace(link, linkReplace);
    }
  } while (matches);
  return doc;
}

function note2JekyllMdFile(
  note: Note,
  opts: { notesDir: string; engine: DEngine } & DendronSiteConfig
) {
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
  // TODO: HACK
  if (note.id !== "f1af56bb-db27-47ae-8406-61a98de6c78c") {
    note.body = wikiLinkToMd(note, opts.engine, { linkPrefix });
  }
  const filePath = path.join(opts.notesDir, meta.id + ".md");
  return fs.writeFile(
    filePath,
    matter.stringify(note.body || "", { ...meta, ...jekyllProps })
  );
}

export class BuildSiteCommand extends BaseCommand<CommandOpts, CommandOutput> {
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
    const nodes: Note[] = [root];
    const out = [];

    // delete parent from the root
    root["parent"] = null;
    root.custom.nav_order = 0;
    root.title = _.capitalize(root.title);

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

    const copyP = new Promise((resolve, reject) => {
      fs.copy(
        path.join(vaultAssetsDir, "images"),
        path.join(siteAssetsDir, "images"),
        (err) => {
          if (err) {
            err.message += JSON.stringify({ vaultAssetsDir, siteAssetsDir });
            reject(err);
          }
          L.info({ msg: "finish copying" });
          resolve();
        }
      );
    });
    await Promise.all(nodes);
    await copyP;
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
