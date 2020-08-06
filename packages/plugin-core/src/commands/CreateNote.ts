import { Note, SchemaUtils } from "@dendronhq/common-all";
import { DNodeUtils } from "@dendronhq/common-all";
import { DendronEngine } from "@dendronhq/engine-server";
import fs from "fs-extra";
import _ from "lodash";
import { Uri, WorkspaceFolder, window } from "vscode";
import { node2Uri } from "../components/lookup/utils";
import { HistoryService } from "../services/HistoryService";
import { DendronWorkspace } from "../workspace";
import { BaseCommand } from "./base";
import { CONFIG, ConfigKey } from "../constants";
import path from "path";
import moment from "moment";

type CommandOpts = {
  fname: string;
  title: string;
};

type CommandInput = {};

type CommandOutput = Uri;

type AddBehavior = "childOfDomain" | "childOfCurrent" | "asOwnDomain";

export { CommandOpts as CreateNoteOpts };

function genPrefix(fname: string, addBehavior: AddBehavior ) {
  let out: string;
  switch(addBehavior) {
    case "childOfDomain": {
      out = DNodeUtils.domainName(fname);
      break;
    }
    case "childOfCurrent": {
      out = fname;
      break;
    }
    case "asOwnDomain": {
      out = "";
      break;
    }
    default: {
      throw Error(`unknown add Behavior: ${addBehavior}`)
    }
  }
  return out;
}


export abstract class CreateNoteCommand extends BaseCommand<
  CommandOpts,
  CommandOutput,
  CommandInput
> {

  genFname(type: "JOURNAL"|"SCRATCH"): string {
    // gather inputs
    const dateFormatKey: ConfigKey = `DEFAULT_${type}_DATE_FORMAT` as ConfigKey ;
    const dateFormat = DendronWorkspace.configuration().get<string>(
        CONFIG[dateFormatKey].key
    );
    const addKey = `DEFAULT_${type}_ADD_BEHAVIOR` as ConfigKey;
    const addBehavior = DendronWorkspace.configuration().get<string>(
      CONFIG[addKey].key
  );
    const nameKey: ConfigKey = `DEFAULT_${type}_NAME` as ConfigKey ;
    const name = DendronWorkspace.configuration().get<string>(
      CONFIG[nameKey].key
  );
    const valid = ["childOfDomain", "childOfCurrent", "asOwnDomain"];
    if (!_.includes(valid, addBehavior)) {
      throw Error(`${CONFIG[addKey].key} must be one of following ${valid.join(", ")}`)
    }
    const editorPath = window.activeTextEditor?.document.uri.fsPath;
    if (!editorPath) {
      throw Error("not currently in a note");
    }

    // put together
    const cNoteFname = path.basename(editorPath, ".md");
    const prefix = genPrefix(cNoteFname, addBehavior as AddBehavior);
    const noteDate = moment().format(dateFormat);
    return [prefix, name, noteDate].filter(ent => !_.isEmpty(ent)).join(".");
  }

  async execute(opts: CommandOpts): Promise<CommandOutput> {
    const { fname, title } = _.defaults(opts, {});
    const node = new Note({ fname, title });
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
