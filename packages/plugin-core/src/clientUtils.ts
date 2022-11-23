import {
  assertUnreachable,
  ConfigService,
  ConfigUtils,
  DendronConfig,
  DendronError,
  DEngineClient,
  DNodeUtils,
  LookupNoteTypeEnum,
  NoteAddBehavior,
  NoteAddBehaviorEnum,
  NoteUtils,
  SchemaModuleProps,
  Time,
  URI,
} from "@dendronhq/common-all";
import _ from "lodash";
import path from "path";
import * as vscode from "vscode";
import { _noteAddBehaviorEnum } from "./constants";
import { ExtensionProvider } from "./ExtensionProvider";

type CreateFnameOverrides = {
  domain?: string;
};

type CreateFnameOpts = {
  overrides?: CreateFnameOverrides;
};

export class DendronClientUtilsV2 {
  static genNotePrefix(fname: string, addBehavior: NoteAddBehavior) {
    let out: string;
    switch (addBehavior) {
      case "childOfDomain": {
        out = DNodeUtils.domainName(fname);
        break;
      }
      case "childOfDomainNamespace": {
        out = NoteUtils.getPathUpTo(fname, 2);
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
   * Generates a file name for a meeting note. The date format is not
   * configurable, because it needs to match a pre-defined generated schema
   * pattern for meeting notes.
   * @returns
   */
  static getMeetingNoteName() {
    const noteDate = Time.now().toFormat("y.MM.dd");
    return ["meet", noteDate].filter((ent) => !_.isEmpty(ent)).join(".");
  }

  /**
   * Generates a file name for a journal or scratch note. Must be derived by an
   * open note, or passed as an option.
   * @param type 'JOURNAL' | 'SCRATCH'
   * @param opts Options to control how the note will be named
   * @returns The file name of the new note
   */
  static genNoteName(
    type:
      | LookupNoteTypeEnum.journal
      | LookupNoteTypeEnum.scratch
      | LookupNoteTypeEnum.task,
    config: DendronConfig,
    opts?: CreateFnameOpts
  ): {
    noteName: string;
    prefix: string;
  } {
    // gather inputs

    let dateFormat: string;
    let addBehavior: NoteAddBehavior;
    let name: string;

    switch (type) {
      case LookupNoteTypeEnum.scratch: {
        dateFormat =
          ExtensionProvider.getExtension().getWorkspaceSettingOrDefault({
            wsConfigKey: "dendron.defaultScratchDateFormat",
            dendronConfigKey: "workspace.scratch.dateFormat",
            dendronConfig: config,
          });
        addBehavior =
          ExtensionProvider.getExtension().getWorkspaceSettingOrDefault({
            wsConfigKey: "dendron.defaultScratchAddBehavior",
            dendronConfigKey: "workspace.scratch.addBehavior",
            dendronConfig: config,
          });
        name = ExtensionProvider.getExtension().getWorkspaceSettingOrDefault({
          wsConfigKey: "dendron.defaultScratchName",
          dendronConfigKey: "workspace.scratch.name",
          dendronConfig: config,
        });
        break;
      }
      case LookupNoteTypeEnum.journal: {
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
      const choices = Object.keys(NoteAddBehaviorEnum).join(", ");
      throw Error(`${actual} must be one of: ${choices}`);
    }

    const editorPath = vscode.window.activeTextEditor?.document.uri.fsPath;
    const currentNoteFname =
      opts?.overrides?.domain ||
      (editorPath ? path.basename(editorPath, ".md") : undefined);
    if (!currentNoteFname) {
      throw Error("Must be run from within a note");
    }

    const prefix = DendronClientUtilsV2.genNotePrefix(
      currentNoteFname,
      addBehavior
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
    const smod = (await client.getSchema(fname)).data;
    if (!smod) {
      throw new DendronError({ message: "no note found" });
    }
    return smod;
  };

  static async shouldUseVaultPrefix(engine: DEngineClient) {
    const configGetResult = await ConfigService.instance().getConfig(
      URI.file(engine.wsRoot),
      "workspace.enableXVaultWikiLink"
    );
    if (configGetResult.isErr()) {
      throw configGetResult.error;
    }

    const enableXVaultWikiLink = configGetResult.value;
    const useVaultPrefix =
      _.size(engine.vaults) > 1 &&
      _.isBoolean(enableXVaultWikiLink) &&
      enableXVaultWikiLink;
    return useVaultPrefix;
  }
}
