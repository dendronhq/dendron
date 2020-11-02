import { Note, SchemaUtils } from "@dendronhq/common-all";
import { DendronEngine } from "@dendronhq/engine-server";
import fs from "fs-extra";
import _ from "lodash";
import { Uri, WorkspaceFolder } from "vscode";
import { node2Uri } from "../components/lookup/utils";
import { HistoryService } from "../services/HistoryService";
import { DendronWorkspace } from "../workspace";
import { BaseCommand } from "./base";

type CommandOpts = {
  fname: string;
  title: string;
  body?: string;
};

type CommandInput = {};

type CommandOutput = Uri;

export { CommandOpts as CreateNoteOpts };

export abstract class CreateNoteCommand extends BaseCommand<
  CommandOpts,
  CommandOutput,
  CommandInput
> {
  async execute(opts: CommandOpts): Promise<CommandOutput> {
    const { fname, title } = _.defaults(opts, {});
    const node = new Note({ fname, title });
    if (opts.body) {
      node.body = opts.body;
    }
    const wsFolders = DendronWorkspace.workspaceFolders() as WorkspaceFolder[];
    const uri = node2Uri(node, wsFolders);
    const historyService = HistoryService.instance();
    historyService.add({ source: "engine", action: "create", uri });
    const engine = await DendronEngine.getOrCreateEngine();
    SchemaUtils.matchAndApplyTemplate({ note: node, engine });
    if (!fs.existsSync(uri.fsPath)) {
      await engine.write(node, {
        newNode: true,
        parentsAsStubs: true,
      });
    }
    return uri;
  }
}
