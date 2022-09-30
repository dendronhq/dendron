import {
  ConfigUtils,
  genUUID,
  JournalConfig,
  NoteUtils,
  SchemaCreationUtils,
  SchemaToken,
  SchemaUtils,
  Time,
  VaultUtils,
} from "@dendronhq/common-all";
import { vault2Path } from "@dendronhq/common-server";
import { MetadataService } from "@dendronhq/engine-server";
import * as fs from "fs-extra";
import _ from "lodash";
import path from "path";
import * as vscode from "vscode";
import { PickerUtilsV2 } from "../components/lookup/utils";
import { DENDRON_COMMANDS } from "../constants";
import { IDendronExtension } from "../dendronExtensionInterface";
import { ExtensionProvider } from "../ExtensionProvider";
import { JournalNote } from "../traits/journal";
import { VSCodeUtils } from "../vsCodeUtils";
import {
  CommandOpts,
  CreateNoteWithTraitCommand,
} from "./CreateNoteWithTraitCommand";

export type CreateDailyJournalData = {
  isFirstTime: boolean;
  isTemplateCreated: boolean;
  isSchemaCreated: boolean;
};

export class CreateDailyJournalCommand extends CreateNoteWithTraitCommand {
  static requireActiveWorkspace: boolean = true;
  public static DENDRON_TEMPLATES_FNAME: string = "templates";

  constructor(ext: IDendronExtension) {
    const initTrait = () => {
      const config = ExtensionProvider.getDWorkspace().config;
      return new JournalNote(config);
    };
    super(ext, "dendron.journal", initTrait);
    // override the key to maintain compatibility
    this.key = DENDRON_COMMANDS.CREATE_DAILY_JOURNAL_NOTE.key;
  }

  override async execute(opts: CommandOpts): Promise<CreateDailyJournalData> {
    const config = this._extension.getDWorkspace().config;
    const journalConfig = ConfigUtils.getJournal(config);
    const maybeDailyVault = journalConfig.dailyVault;
    const vault = maybeDailyVault
      ? VaultUtils.getVaultByName({
          vaults: this._extension.getEngine().vaults,
          vname: maybeDailyVault,
        })
      : undefined;
    let isFirstTime = false;
    let isSchemaCreated = false;
    let isTemplateCreated = false;

    const metaData = MetadataService.instance().getMeta();
    // Only create default schema/template if running Daily Journal for first time after 5/31/22
    if (_.isUndefined(metaData.firstDailyJournalTime)) {
      isFirstTime = true;
      MetadataService.instance().setFirstDailyJournalTime();
      if (
        !_.isUndefined(metaData.firstInstall) &&
        metaData.firstInstall > Time.DateTime.fromISO("2022-06-06").toSeconds()
      ) {
        // Check if a schema file exists, and if it doesn't, then create it first.
        isSchemaCreated = await this.makeSchemaFileIfNotExisting(journalConfig);
        // same with template file:
        isTemplateCreated = await this.createTemplateFileIfNotExisting(
          journalConfig
        );
      }
    }

    await super.execute({ ...opts, vaultOverride: vault });

    return { isFirstTime, isSchemaCreated, isTemplateCreated };
  }

  /**
   * Track whether new schema or template files were created
   */
  addAnalyticsPayload(_opts: CommandOpts, resp: CreateDailyJournalData) {
    return { resp };
  }

  /**
   * Create the pre-canned schema so that we can apply a template to the user's
   * daily journal notes if the schema with the daily journal domain doesn't exist yet.
   *
   * @returns whether a new schema file was made
   */
  private async makeSchemaFileIfNotExisting(
    journalConfig: JournalConfig
  ): Promise<boolean> {
    const dailyDomain = journalConfig.dailyDomain;
    if (
      await SchemaUtils.doesSchemaExist({
        id: dailyDomain,
        engine: this._extension.getEngine(),
      })
    ) {
      return false;
    }

    const maybeVault = journalConfig.dailyVault
      ? VaultUtils.getVaultByName({
          vaults: this._extension.getEngine().vaults,
          vname: journalConfig.dailyVault,
        })
      : undefined;
    const vaultPath = vault2Path({
      vault: maybeVault || PickerUtilsV2.getVaultForOpenEditor(),
      wsRoot: ExtensionProvider.getDWorkspace().wsRoot,
    });

    const uri = vscode.Uri.file(
      SchemaUtils.getPath({ root: vaultPath, fname: `dendron.${dailyDomain}` })
    );

    const topLevel = {
      id: dailyDomain,
      title: dailyDomain,
      parent: "root",
      desc: "Identifier that will be used when using 'Lookup (Schema)' command.",
    };

    const tokenizedMatrix: SchemaToken[][] = [
      [
        { pattern: dailyDomain },
        {
          pattern: journalConfig.name,
          desc: "This pattern matches the 'journal' child hierarchy",
        },
        {
          pattern: "[0-2][0-9][0-9][0-9]",
          desc: "This pattern matches the YYYY (year) child hierarchy",
        },
        {
          pattern: "[0-1][0-9]",
          desc: "This pattern matches the MM (month) child hierarchy",
        },
        {
          pattern: "[0-3][0-9]",
          desc: "This pattern matches the DD (day) child hierarchy",
          template: {
            id:
              CreateDailyJournalCommand.DENDRON_TEMPLATES_FNAME +
              `.${dailyDomain}`,
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
   * Create the pre-canned daily journal template file in the user's workspace if it
   * doesn't exist yet.
   *
   * @returns whether a new template file was made
   */
  private async createTemplateFileIfNotExisting(
    journalConfig: JournalConfig
  ): Promise<boolean> {
    const fname =
      CreateDailyJournalCommand.DENDRON_TEMPLATES_FNAME +
      `.${journalConfig.dailyDomain}`;
    const fileName = fname + `.md`;

    const existingTemplates = await this._extension
      .getEngine()
      .findNotesMeta({ fname });

    const maybeVault = journalConfig.dailyVault
      ? VaultUtils.getVaultByName({
          vaults: this._extension.getEngine().vaults,
          vname: journalConfig.dailyVault,
        })
      : undefined;
    const vault = maybeVault || PickerUtilsV2.getVaultForOpenEditor();
    const vaultPath = vault2Path({
      vault: PickerUtilsV2.getVaultForOpenEditor(),
      wsRoot: ExtensionProvider.getDWorkspace().wsRoot,
    });

    if (existingTemplates.length > 0) {
      return false;
    }

    const destfPath = path.join(vaultPath, fileName);

    // In addition to checking the engine on whether a note already exists,
    // check the file system path for the template file to ensure copying
    // succeeds
    if (await fs.pathExists(destfPath)) {
      return false;
    }

    const assetUri = VSCodeUtils.getAssetUri(this._extension.context);
    const dendronWSTemplate = VSCodeUtils.joinPath(assetUri, "dendron-ws");

    const src = path.join(dendronWSTemplate.fsPath, "templates", fileName);
    const body = (await fs.readFile(src)).toString();

    // Ensure that engine state is aware of the template before returning so
    // that the template can be found when creating the daily journal note.
    const templateNoteProps = NoteUtils.create({
      fname,
      vault,
      id: genUUID(),
      title: "Daily Journal Template",
      body,
    });

    await this._extension.getEngine().writeNote(templateNoteProps);

    vscode.window.showInformationMessage(
      `Created template for your daily journal notes at ${fname}`
    );

    return true;
  }
}
