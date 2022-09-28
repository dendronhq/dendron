import {
  genUUID,
  NoteUtils,
  SchemaCreationUtils,
  SchemaToken,
  SchemaUtils,
} from "@dendronhq/common-all";
import { vault2Path } from "@dendronhq/common-server";
import * as fs from "fs-extra";
import path from "path";
import * as vscode from "vscode";
import { PickerUtilsV2 } from "../components/lookup/utils";
import { DENDRON_COMMANDS } from "../constants";
import { IDendronExtension } from "../dendronExtensionInterface";
import { ExtensionProvider } from "../ExtensionProvider";
import { MeetingNote } from "../traits/MeetingNote";
import { VSCodeUtils } from "../vsCodeUtils";
import {
  CommandOpts,
  CreateNoteWithTraitCommand,
} from "./CreateNoteWithTraitCommand";

// internal to this class
type ExecuteData = {
  templateCreated: boolean;
  schemaCreated: boolean;
};

export class CreateMeetingNoteCommand extends CreateNoteWithTraitCommand {
  private _ext: IDendronExtension;
  public static requireActiveWorkspace: boolean = true;
  public static MEETING_TEMPLATE_FNAME: string = "templates.meet";

  /**
   *
   * @param ext
   * @param noConfirm - for testing purposes only; don't set in production code
   */
  constructor(ext: IDendronExtension, noConfirm?: boolean) {
    const initTrait = () => {
      const config = ExtensionProvider.getDWorkspace().config;
      return new MeetingNote(config, ext, noConfirm ?? false);
    };

    super(ext, "dendron.meeting", initTrait);
    this.key = DENDRON_COMMANDS.CREATE_MEETING_NOTE.key;
    this._ext = ext;
  }

  async execute(opts: CommandOpts): Promise<ExecuteData> {
    // Check if a schema file exists, and if it doesn't, then create it first.
    const schemaCreated = await this.makeSchemaFileIfNotExisting();

    // same with template file:
    const templateCreated = await this.createTemplateFileIfNotExisting();

    await super.execute(opts);

    return { schemaCreated, templateCreated };
  }

  /**
   * Track whether new schema or template files were created
   */
  addAnalyticsPayload(_opts: CommandOpts, resp: ExecuteData) {
    return { resp };
  }

  /**
   * Create the pre-canned schema so that we can apply a template to the user's
   * meeting notes if the schema doesn't exist yet.
   * @returns whether a new schema file was made
   */
  private async makeSchemaFileIfNotExisting(): Promise<boolean> {
    const vaultPath = vault2Path({
      vault: PickerUtilsV2.getVaultForOpenEditor(),
      wsRoot: ExtensionProvider.getDWorkspace().wsRoot,
    });

    const uri = vscode.Uri.file(
      SchemaUtils.getPath({ root: vaultPath, fname: "dendron.meet" })
    );

    if (await fs.pathExists(uri.fsPath)) {
      return false;
    }

    const topLevel = {
      id: "meet",
      title: "meet",
      parent: "root",
      pattern: "meet",
    };

    const tokenizedMatrix: SchemaToken[][] = [
      [
        { pattern: "meet" },
        { pattern: "[0-9][0-9][0-9][0-9]" },
        { pattern: "[0-9][0-9]" },
        {
          pattern: "[0-9][0-9]",
          template: {
            id: CreateMeetingNoteCommand.MEETING_TEMPLATE_FNAME,
            type: "note",
          },
        },
        {
          pattern: "*",
          template: {
            id: CreateMeetingNoteCommand.MEETING_TEMPLATE_FNAME,
            type: "note",
          },
        },
      ],
    ];

    const schemaJson = SchemaCreationUtils.getBodyForTokenizedMatrix({
      topLevel,
      tokenizedMatrix,
    });

    await fs.writeFile(uri.fsPath, schemaJson);

    await ExtensionProvider.getExtension().schemaSyncService.saveSchema({
      uri: uri!,
      isBrandNewFile: true,
    });

    return true;
  }

  /**
   * Create the pre-canned meeting template file in the user's workspace if it
   * doesn't exist yet.
   * @returns whether a new template file was made
   */
  private async createTemplateFileIfNotExisting(): Promise<boolean> {
    const fname = CreateMeetingNoteCommand.MEETING_TEMPLATE_FNAME + ".md";

    const existingMeetingTemplates = await this._extension
      .getEngine()
      .findNotesMeta({
        fname: CreateMeetingNoteCommand.MEETING_TEMPLATE_FNAME,
      });

    const vault = PickerUtilsV2.getVaultForOpenEditor();
    const vaultPath = vault2Path({
      vault,
      wsRoot: ExtensionProvider.getDWorkspace().wsRoot,
    });

    if (existingMeetingTemplates.length > 0) {
      return false;
    }

    const destfPath = path.join(vaultPath, fname);

    // In addition to checking the engine on whether a note already exists,
    // check the file system path for the template file to ensure copying
    // succeeds
    if (await fs.pathExists(destfPath)) {
      return false;
    }

    const assetUri = VSCodeUtils.getAssetUri(this._ext.context);
    const dendronWSTemplate = VSCodeUtils.joinPath(assetUri, "dendron-ws");

    const src = path.join(dendronWSTemplate.fsPath, "templates", fname);
    const body = (await fs.readFile(src)).toString();

    // Ensure that engine state is aware of the template before returning so
    // that the template can be found when creating the meeting note. TODO: This
    // is a bit fragile - make sure this ID matches what's in our built in
    // template
    const templateNoteProps = NoteUtils.create({
      fname: CreateMeetingNoteCommand.MEETING_TEMPLATE_FNAME,
      vault,
      id: genUUID(),
      title: "Meeting Notes Template",
      body,
    });

    await this._ext.getEngine().writeNote(templateNoteProps);

    vscode.window.showInformationMessage(
      `Created template for your meeting notes at ${CreateMeetingNoteCommand.MEETING_TEMPLATE_FNAME}`
    );

    return true;
  }
}
