import { DEngine, DNodeUtils, Note, SchemaUtils } from "@dendronhq/common-all";
import { DendronEngine } from "@dendronhq/engine-server";
import fs from "fs-extra";
import _ from "lodash";
import moment from "moment";
import path from "path";
import { Uri, window, WorkspaceFolder } from "vscode";
import { node2Uri } from "../components/lookup/utils";
import { CONFIG, ConfigKey, _noteAddBehaviorEnum } from "../constants";
import { HistoryService } from "../services/HistoryService";
import { DendronWorkspace } from "../workspace";
import { BaseCommand } from "./base";

type CommandOpts = {
  fname: string;
  title: string;
};

type CommandInput = {};

type CommandOutput = Uri;

type AddBehavior =
  | "childOfDomain"
  | "childOfCurrent"
  | "asOwnDomain"
  | "childOfDomainNamespace";

export { CommandOpts as CreateNoteOpts };

function genPrefix(
  fname: string,
  addBehavior: AddBehavior,
  opts: { engine: DEngine }
) {
  let out: string;
  switch (addBehavior) {
    case "childOfDomain": {
      out = DNodeUtils.domainName(fname);
      break;
    }
    case "childOfDomainNamespace": {
      out = DNodeUtils.domainName(fname);
      const domain = DNodeUtils.getNoteByFname(out, opts.engine);
      if (domain) {
        const schema = SchemaUtils.matchNote(domain, opts.engine.schemas);
        if (schema && schema.namespace) {
          out = DNodeUtils.getPathUpTo(fname, 2);
        }
      }
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
      throw Error(`unknown add Behavior: ${addBehavior}`);
    }
  }
  return out;
}

type CreateFnameOverrides = {
  domain?: string;
};

type CreateFnameOpts = {
  overrides?: CreateFnameOverrides;
};

export abstract class CreateNoteCommand extends BaseCommand<
  CommandOpts,
  CommandOutput,
  CommandInput
> {
  genFname(type: "JOURNAL" | "SCRATCH", opts?: CreateFnameOpts): string {
    // gather inputs
    const dateFormatKey: ConfigKey = `DEFAULT_${type}_DATE_FORMAT` as ConfigKey;
    const dateFormat = DendronWorkspace.configuration().get<string>(
      CONFIG[dateFormatKey].key
    );
    const addKey = `DEFAULT_${type}_ADD_BEHAVIOR` as ConfigKey;
    const addBehavior = DendronWorkspace.configuration().get<string>(
      CONFIG[addKey].key
    );
    const nameKey: ConfigKey = `DEFAULT_${type}_NAME` as ConfigKey;
    const name = DendronWorkspace.configuration().get<string>(
      CONFIG[nameKey].key
    );
    if (!_.includes(_noteAddBehaviorEnum, addBehavior)) {
      throw Error(
        `${
          CONFIG[addKey].key
        } must be one of following ${_noteAddBehaviorEnum.join(", ")}`
      );
    }
    const editorPath = window.activeTextEditor?.document.uri.fsPath;
    if (!editorPath) {
      throw Error("not currently in a note");
    }

    const engine = DendronWorkspace.instance().engine;
    // put together
    const cNoteFname =
      opts?.overrides?.domain || path.basename(editorPath, ".md");
    const prefix = genPrefix(cNoteFname, addBehavior as AddBehavior, {
      engine,
    });
    const noteDate = moment().format(dateFormat);
    return [prefix, name, noteDate].filter((ent) => !_.isEmpty(ent)).join(".");
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
