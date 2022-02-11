import {
  assertUnreachable,
  ConfigUtils,
  DendronError,
  DEngineClient,
  DNodeUtils,
  LegacyNoteAddBehavior,
  NoteAddBehavior,
  NoteUtils,
  SchemaModuleProps,
  Time,
} from "@dendronhq/common-all";
import _ from "lodash";
import path from "path";
import * as vscode from "vscode";
import { LookupNoteTypeEnum } from "./components/lookup/types";
import { PickerUtilsV2 } from "./components/lookup/utils";
import { _noteAddBehaviorEnum } from "./constants";
import { ExtensionProvider } from "./ExtensionProvider";

type CreateFnameOverrides = {
  domain?: string;
};

type CreateFnameOpts = {
  overrides?: CreateFnameOverrides;
};

type AddBehavior =
  | "childOfDomain"
  | "childOfCurrent"
  | "asOwnDomain"
  | "childOfDomainNamespace";

export class DendronClientUtilsV2 {
  static genNotePrefix(
    fname: string,
    addBehavior: AddBehavior,
    opts: { engine: DEngineClient }
  ) {
    let out: string;
    switch (addBehavior) {
      case "childOfDomain": {
        out = DNodeUtils.domainName(fname);
        break;
      }
      case "childOfDomainNamespace": {
        // out = "hello";
        // const domain: NoteProps | undefined = undefined;
        out = DNodeUtils.domainName(fname);
        const vault = PickerUtilsV2.getOrPromptVaultForOpenEditor();
        const domain = NoteUtils.getNoteByFnameV5({
          fname,
          notes: opts.engine.notes,
          vault,
          wsRoot: ExtensionProvider.getDWorkspace().wsRoot,
        });
        if (domain && domain.schema) {
          const smod = opts.engine.schemas[domain.schema.moduleId];
          const schema = smod.schemas[domain.schema.schemaId];
          if (schema && schema.data.namespace) {
            out = NoteUtils.getPathUpTo(fname, 2);
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

  /**
   * Generates a file name for a journal or scratch note. Must be derived by an
   * open note, or passed as an option.
   * @param type 'JOURNAL' | 'SCRATCH'
   * @param opts Options to control how the note will be named
   * @returns The file name of the new note
   */
  static genNoteName(
    type: "JOURNAL" | "SCRATCH" | LookupNoteTypeEnum.task,
    opts?: CreateFnameOpts
  ): {
    noteName: string;
    prefix: string;
  } {
    // gather inputs
    const config = ExtensionProvider.getDWorkspace().config;

    let dateFormat: string;
    let addBehavior: NoteAddBehavior;
    let name: string;

    switch (type) {
      case "SCRATCH": {
        dateFormat =
          ExtensionProvider.getExtension().getWorkspaceSettingOrDefault({
            wsConfigKey: "dendron.defaultScratchDateFormat",
            dendronConfigKey: "workspace.scratch.dateFormat",
          });
        addBehavior =
          ExtensionProvider.getExtension().getWorkspaceSettingOrDefault({
            wsConfigKey: "dendron.defaultScratchAddBehavior",
            dendronConfigKey: "workspace.scratch.addBehavior",
          });
        name = ExtensionProvider.getExtension().getWorkspaceSettingOrDefault({
          wsConfigKey: "dendron.defaultScratchName",
          dendronConfigKey: "workspace.scratch.name",
        });
        break;
      }
      case "JOURNAL": {
        const journalConfig = ConfigUtils.getJournal(config);
        dateFormat = journalConfig.dateFormat;
        addBehavior = journalConfig.addBehavior;
        name = journalConfig.name;
        break;
      }
      case LookupNoteTypeEnum.task: {
        const taskConfig = ConfigUtils.getTask(config);
        dateFormat = taskConfig.dateFormat;
        addBehavior = taskConfig.addBehavior;
        name = taskConfig.name;
        break;
      }
      default:
        assertUnreachable(type);
    }

    if (!_.includes(_noteAddBehaviorEnum, addBehavior)) {
      const actual = addBehavior;
      const choices = Object.keys(LegacyNoteAddBehavior).join(", ");
      throw Error(`${actual} must be one of: ${choices}`);
    }

    const editorPath = vscode.window.activeTextEditor?.document.uri.fsPath;
    const currentNoteFname =
      opts?.overrides?.domain ||
      (editorPath ? path.basename(editorPath, ".md") : undefined);
    if (!currentNoteFname) {
      throw Error("Must be run from within a note");
    }

    const engine = ExtensionProvider.getEngine();
    const prefix = DendronClientUtilsV2.genNotePrefix(
      currentNoteFname,
      addBehavior as AddBehavior,
      {
        engine,
      }
    );

    const noteDate = Time.now().toFormat(dateFormat);
    const noteName = [prefix, name, noteDate]
      .filter((ent) => !_.isEmpty(ent))
      .join(".");
    return { noteName, prefix };
  }

  static getSchemaModByFname = async ({
    fname,
    client,
  }: {
    fname: string;
    client: DEngineClient;
  }): Promise<SchemaModuleProps> => {
    const smod = _.find(client.schemas, { fname });
    if (!smod) {
      throw new DendronError({ message: "no note found" });
    }
    return smod;
  };

  static shouldUseVaultPrefix(engine: DEngineClient) {
    const config = ExtensionProvider.getDWorkspace().config;
    const enableXVaultWikiLink =
      ConfigUtils.getWorkspace(config).enableXVaultWikiLink;
    const useVaultPrefix =
      _.size(engine.vaults) > 1 &&
      _.isBoolean(enableXVaultWikiLink) &&
      enableXVaultWikiLink;
    return useVaultPrefix;
  }
}
