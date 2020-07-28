import { DEngine, DNodeUtils, Note } from "@dendronhq/common-all";
import fs from "fs-extra";
import matter from "gray-matter";
import _ from "lodash";
import path from "path";
import { BaseCommand } from "./base";

type CommandOpts = {
  engine: DEngine;
} & CommandCommonOpts;

type CommandCommonOpts = {
  /**
   * Where is site
   */
  siteRoot: string;
};

type CommandOutput = void;

type DendronSiteConfig = {
  root: string;
};

type DendronJekyllProps = {
  hpath: string;
  permalink?: string;
};

function note2JekyllMdFile(
  note: Note,
  opts: { notesDir: string } & DendronSiteConfig
) {
  const meta = DNodeUtils.getMeta(note, { pullCustomUp: true });
  const jekyllProps: DendronJekyllProps = {
    hpath: note.path
  };
  if (opts.root === meta.fname) {
    jekyllProps["permalink"] = "/";
  }
  // pull children of root to the top
  if (note.parent?.fname === opts.root) {
    delete meta["parent"];
  }
  const filePath = path.join(opts.notesDir, meta.fname + ".md");
  return fs.writeFile(
    filePath,
    matter.stringify(note.body || "", { ...meta, ...jekyllProps })
  );
}

export class BuildSiteCommand extends BaseCommand<CommandOpts, CommandOutput> {
  async execute(opts: CommandOpts) {
    const { engine, siteRoot } = _.defaults(opts, {});
    const notesDir = "docs";
    const notesDirPath = path.join(siteRoot, notesDir);
    fs.ensureDirSync(notesDirPath);
    // TODO: ask for confirmation
    fs.emptyDirSync(notesDirPath);
    const config: DendronSiteConfig = {
      root: "dendron"
    };
    const root: Note = _.find(engine.notes, { fname: config.root }) as Note;
    if (_.isUndefined(root)) {
      throw Error(`root ${root} not found`);
    }
    const nodes: Note[] = [root];
    const out = [];
    while (!_.isEmpty(nodes)) {
      const node = nodes.pop() as Note;
      out.push(note2JekyllMdFile(node, { notesDir: notesDirPath, ...config }));
      node.children.forEach(n => nodes.push(n as Note));
    }
    await Promise.all(nodes);
    //   _.values(engine.notes).map(n => {
    //     return note2JekyllMdFile(n, { notesDir: notesDirPath });
    //   })
    // );
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
