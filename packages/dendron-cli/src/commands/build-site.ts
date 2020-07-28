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

function note2JekyllMdFile(note: Note, opts: { notesDir: string }) {
  const meta = DNodeUtils.getMeta(note);
  const jekyllProps = {
    hpath: note.path
  };
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
    await Promise.all(_.values(engine.notes).map(n => {
      return note2JekyllMdFile(n, { notesDir: notesDirPath });
    }));
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
