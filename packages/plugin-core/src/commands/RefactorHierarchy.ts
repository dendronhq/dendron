import _ from "lodash";
import path from "path";
import { window } from "vscode";
import { DendronWorkspace } from "../workspace";
import { BaseCommand } from "./base";
import execa from "execa";

type CommandOpts = {
  preview: boolean;
};

type CommandInput = {};

type CommandOutput = void;

export class RefactorHierarchyCommand extends BaseCommand<
  CommandOpts,
  CommandOutput,
  CommandInput
> {
  async gatherInputs(): Promise<CommandInput | undefined> {
    const resp = await window.showInputBox({
      prompt: "Select your folder for dendron",
      ignoreFocusOut: true,
      validateInput: (input: string) => {
        if (!path.isAbsolute(input)) {
          if (input[0] !== "~") {
            return "must enter absolute path";
          }
        }
        return undefined;
      },
    });
    if (_.isUndefined(resp)) {
      return;
    }
    return;
  }
  async execute(opts: CommandOpts) {
    const { preview } = _.defaults(opts, { preview: false });
    const ws = DendronWorkspace.instance();
    const notes = ws.engine.notes;
    const pattern = "^pro.";
    const replacer = "";
    const re = new RegExp(`(.*)(${pattern})(.*)`);
    const candidates = _.map(notes, (n) => {
      if (n.stub) {
        return false;
      }
      return re.exec(n.fname);
    }).filter(Boolean);
    const operations = candidates.map((matchObj) => {
      // @ts-ignore
      let [
        src,
        prefix,
        // @ts-ignore
        _replace,
        suffix,
        // @ts-ignore
        ..._rest
      ] = matchObj as RegExpExecArray;
      const dst = [prefix, replacer, suffix]
        .filter((ent) => !_.isEmpty(ent))
        .join("");
      return { src, dst };
    });
    _.reduce(
      operations,
      async (prev, { src, dst }) => {
        await prev;
        const notesdir = "/Users/kevinlin/.pyenv/versions/3.7.5/bin/notesdir";
        let cmd = `${notesdir} mv ${src}.md ${dst}.md`;
        if (preview) {
          cmd += " -p";
        }
        console.log(cmd);
        const out = await execa.command(cmd, {
          cwd: ws.rootWorkspace.uri.fsPath,
        });
        console.log(out);
        return;
      },
      Promise.resolve()
    );
    return;
  }
}
