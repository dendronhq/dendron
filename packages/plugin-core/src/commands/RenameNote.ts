import { resolvePath } from "@dendronhq/common-server";
import execa from "execa";
import fs from "fs-extra";
import _ from "lodash";
import path from "path";
import { window } from "vscode";
import { CONFIG } from "../constants";
import { HistoryService } from "../services/HistoryService";
import { VSCodeUtils } from "../utils";
import { DendronWorkspace } from "../workspace";
import { BasicCommand } from "./base";

type CommandOpts = {
  dest: string;
  preview: boolean;
};

type CommandOutput = void;

export class RenameNoteCommand extends BasicCommand<
  CommandOpts,
  CommandOutput
> {
  public notesDirConfPath = resolvePath("~/.notesdir.conf.py");

  async sanityCheck() {
    const notesdir = DendronWorkspace.configuration().get<string | undefined>(
      CONFIG.NOTESDIR_PATH.key
    );
    if (_.isUndefined(notesdir) || _.isEmpty(notesdir)) {
      return `${CONFIG.NOTESDIR_PATH.key} must be set`;
    }
    return;
  }

  async gatherInputs(): Promise<CommandOpts | undefined> {
    const resp = await VSCodeUtils.showInputBox({
      prompt: "Rename file",
      ignoreFocusOut: true,
      value: path.basename(
        VSCodeUtils.getActiveTextEditor()?.document.uri.fsPath || "",
        ".md"
      ),
    });
    if (_.isUndefined(resp)) {
      return;
    }
    return {
      dest: resp as string,
      preview: false,
    };
  }

  installNotesDirConf(vaultDir: string) {
    window.showInformationMessage("installing notesdir config");
    return fs.writeFileSync(this.notesDirConfPath, genNotesConfig(vaultDir), {
      encoding: "utf8",
    });
  }

  checkConfig(vaultDir: string) {
    if (!fs.existsSync(this.notesDirConfPath)) {
      this.installNotesDirConf(vaultDir);
    }
    if (
      fs
        .readFileSync(this.notesDirConfPath, { encoding: "utf8" })
        .indexOf(vaultDir) < 0
    ) {
      this.installNotesDirConf(vaultDir);
    }
  }

  async execute(opts: CommandOpts) {
    const {} = _.defaults(opts);
    const notesdir = DendronWorkspace.configuration().get<string>(
      CONFIG.NOTESDIR_PATH.key
    ) as string;
    const vaultDir = DendronWorkspace.rootWorkspaceFolder()?.uri
      .fsPath as string;
    this.checkConfig(vaultDir);
    const activeTextEditor = VSCodeUtils.getActiveTextEditor();
    if (!activeTextEditor) {
      window.showErrorMessage("no active text editor");
      return;
    }
    const src = path.basename(activeTextEditor.document.uri.fsPath);
    if (!opts.dest.endsWith(".md")) {
      opts.dest += ".md";
    }
    let cmd = `${notesdir} mv ${src} ${opts.dest} --json`;
    if (opts.preview) {
      cmd += " -p";
    }
    try {
      HistoryService.instance().add({
        action: "rename",
        source: "src",
        uri: activeTextEditor.document.uri,
      });
      const out = await execa.command(`${cmd}`, { cwd: vaultDir });
      window.showInformationMessage(out.stdout);
      this.L.info(out);
    } catch (err) {
      this.L.error(err);
      throw err;
    }
  }
}

function genNotesConfig(root: string): string {
  const notesConfg = `
from notesdir.conf import *

conf = NotesdirConf(
    repo_conf = SqliteRepoConf(
        root_paths={
            "${root}"
        },
        cache_path='/tmp/notesdir-cache.sqlite3'
    ),
    template_globs=[]
)

def path_organizer(info):
    path = rewrite_name_using_title(info)
    return resource_path_fn(path) or path

conf.path_organizer = path_organizer

def skip_parse(parentpath, filename):
    return filename.endswith('.resources')

conf.repo_conf.skip_parse = skip_parse

`;
  return notesConfg;
}
