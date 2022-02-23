import { ErrorFactory, NoteProps, ResponseUtil } from "@dendronhq/common-all";
import {
  Client,
  ConfigFileUtils,
  createRunnableNotionV2PodConfigSchema,
  ExportPodV2,
  ExternalConnectionManager,
  ExternalService,
  isRunnableNotionV2PodConfig,
  JSONSchemaType,
  NotionConnection,
  NotionExportPodV2,
  NotionExportReturnType,
  NotionUtils,
  NotionV2PodConfig,
  Page,
  PodV2Types,
  RunnableNotionV2PodConfig,
  TitlePropertyValue,
} from "@dendronhq/pods-core";
import _ from "lodash";
import path from "path";
import * as vscode from "vscode";
import { ProgressLocation, window } from "vscode";
import { QuickPickHierarchySelector } from "../../components/lookup/HierarchySelector";
import { PodUIControls } from "../../components/pods/PodControls";
import { ExtensionProvider } from "../../ExtensionProvider";
import { VSCodeUtils } from "../../vsCodeUtils";
import { getExtension } from "../../workspace";
import { BaseExportPodCommand } from "./BaseExportPodCommand";

/**
 * VSCode command for running the Notion Export Pod. It is not meant to be
 * directly invoked throught the command palette, but is invoked by
 * {@link ExportPodV2Command}
 */
export class NotionExportPodCommand extends BaseExportPodCommand<
  RunnableNotionV2PodConfig,
  NotionExportReturnType
> {
  public key = "dendron.notionexport";

  public constructor() {
    super(new QuickPickHierarchySelector());
  }

  public createPod(
    config: RunnableNotionV2PodConfig
  ): ExportPodV2<NotionExportReturnType> {
    return new NotionExportPodV2({
      podConfig: config,
    });
  }

  public getRunnableSchema(): JSONSchemaType<RunnableNotionV2PodConfig> {
    return createRunnableNotionV2PodConfigSchema();
  }

  async gatherInputs(
    opts?: Partial<NotionV2PodConfig & NotionConnection>
  ): Promise<RunnableNotionV2PodConfig | undefined> {
    if (isRunnableNotionV2PodConfig(opts)) return opts;
    let apiKey: string | undefined = opts?.apiKey;
    let connectionId: string | undefined = opts?.connectionId;

    // Get an Notion API Key
    if (!apiKey) {
      const mngr = new ExternalConnectionManager(getExtension().podsDir);
      // If the apiKey doesn't exist, see if we can first extract it from the connectedServiceId:
      if (opts?.connectionId) {
        const config = mngr.getConfigById<NotionConnection>({
          id: opts.connectionId,
        });

        if (!config) {
          window.showErrorMessage(
            `Couldn't find service config with the specified connection ID ${opts.connectionId}. Ensure that the connection ID is correct. You can check existing connections with the Dendron: Configure Service Connection command.`
          );
          return;
        }
        apiKey = config.apiKey;
      } else {
        // Prompt User to pick an notion connection, or create a new one
        // (which will stop execution of current pod command)
        const connection =
          await PodUIControls.promptForExternalServiceConnectionOrNew<NotionConnection>(
            ExternalService.Notion
          );

        if (!connection) {
          return;
        }

        connectionId = connection.connectionId;
        apiKey = connection.apiKey;
      }
    }

    // Get the export scope
    const exportScope =
      opts && opts.exportScope
        ? opts.exportScope
        : await PodUIControls.promptForExportScope();

    if (!exportScope) {
      return;
    }
    let parentPageId = opts?.parentPageId;
    if (_.isUndefined(parentPageId)) {
      const pagesMap = await this.getAllNotionPages(apiKey);
      const parentPage = await this.promptForParentPage(Object.keys(pagesMap));
      if (_.isUndefined(parentPage)) return;
      parentPageId = pagesMap[parentPage];
    }

    const inputs = {
      exportScope,
      parentPageId,
      ...opts,
      podType: PodV2Types.NotionExportV2,
      apiKey,
      connectionId,
    };

    if (!opts?.podId) {
      const choice = await PodUIControls.promptToSaveInputChoicesAsNewConfig();

      if (choice !== undefined && choice !== false) {
        const configPath = ConfigFileUtils.genConfigFileV2({
          fPath: path.join(
            getExtension().podsDir,
            "custom",
            `config.${choice}.yml`
          ),
          configSchema: NotionExportPodV2.config(),
          setProperties: _.merge(inputs, {
            podId: choice,
            podType: PodV2Types.NotionExportV2,
            connectionId: inputs.connectionId,
          }),
        });

        vscode.window
          .showInformationMessage(
            `Configuration saved to ${configPath}`,
            "Open Config"
          )
          .then((selectedItem) => {
            if (selectedItem) {
              VSCodeUtils.openFileInEditor(vscode.Uri.file(configPath));
            }
          });
      }
    }

    return inputs;
  }

  public async onExportComplete({
    exportReturnValue,
  }: {
    exportReturnValue: NotionExportReturnType;
    config: RunnableNotionV2PodConfig;
    payload: NoteProps[];
  }) {
    const engine = ExtensionProvider.getEngine();
    const { data } = exportReturnValue;
    if (data?.created) {
      await NotionUtils.updateNotionIdForNewlyCreatedNotes(
        data.created,
        engine
      );
    }
    const createdCount = data?.created?.length ?? 0;
    if (ResponseUtil.hasError(exportReturnValue)) {
      const errorMsg = `Finished Notion Export. ${createdCount} notes created in Notion; Error encountered: ${ErrorFactory.safeStringify(
        exportReturnValue.error
      )}`;

      this.L.error(errorMsg);
    } else {
      window.showInformationMessage(
        `Finished Notion Export. ${createdCount} notes created in Notion`
      );
    }
  }

  getAllNotionPages = async (apiKey: string) => {
    const pagesMap = await window.withProgress(
      {
        location: ProgressLocation.Notification,
        title: "Fetching Parent Pages...",
        cancellable: false,
      },
      async () => {
        const notion = new Client({
          auth: apiKey,
        });
        const allDocs = await notion.search({
          sort: { direction: "descending", timestamp: "last_edited_time" },
          filter: { value: "page", property: "object" },
        });
        const pagesMap: { [key: string]: string } = {};
        const pages = allDocs.results as Page[];
        pages.map((page: Page) => {
          const key = this.getPageName(page);
          const value = page.id;
          pagesMap[key] = value;
        });
        return pagesMap;
      }
    );
    return pagesMap;
  };

  /**
   * Method to get page name of a Notion Page
   */
  getPageName = (page: Page) => {
    const { title } =
      page.parent.type !== "database_id"
        ? (page.properties.title as TitlePropertyValue)
        : (page.properties.Name as TitlePropertyValue);
    return title[0] ? title[0].plain_text : "Untitled";
  };

  /**
   * Prompt to choose the Parent Page in Notion. All the exported notes are created inside this page.
   * It is mandatory to have a parent page while create pages via API.
   * @param pagesMap
   * @returns pageId of selected page.
   */
  promptForParentPage = async (
    pagesMap: string[]
  ): Promise<string | undefined> => {
    const pickItems = pagesMap.map((page) => {
      return {
        label: page,
      };
    });
    const selected = await window.showQuickPick(pickItems, {
      placeHolder: "Choose the Parent Page",
      ignoreFocusOut: true,
      matchOnDescription: true,
      canPickMany: false,
    });
    if (!selected) {
      return;
    }
    return selected.label;
  };
}
