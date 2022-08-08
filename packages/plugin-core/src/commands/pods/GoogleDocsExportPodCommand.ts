import {
  axios,
  ErrorFactory,
  NoteProps,
  ResponseUtil,
  stringifyError,
  Time,
} from "@dendronhq/common-all";
import { EngineUtils, openPortFile } from "@dendronhq/engine-server";
import {
  ConfigFileUtils,
  createRunnableGoogleDocsV2PodConfigSchema,
  ExportPodV2,
  ExternalConnectionManager,
  ExternalService,
  GoogleDocsConnection,
  GoogleDocsExportPodV2,
  GoogleDocsExportReturnType,
  GoogleDocsUtils,
  GoogleDocsV2PodConfig,
  isRunnableGoogleDocsV2PodConfig,
  JSONSchemaType,
  PodUtils,
  PodV2Types,
  RunnableGoogleDocsV2PodConfig,
} from "@dendronhq/pods-core";
import _ from "lodash";
import * as vscode from "vscode";
import { window } from "vscode";
import { QuickPickHierarchySelector } from "../../components/lookup/HierarchySelector";
import { PodUIControls } from "../../components/pods/PodControls";
import { IDendronExtension } from "../../dendronExtensionInterface";
import { launchGoogleOAuthFlow } from "../../utils/pods";
import { VSCodeUtils } from "../../vsCodeUtils";
import { BaseExportPodCommand } from "./BaseExportPodCommand";

/**
 * VSCode command for running the Google Docs Export Pod. It is not meant to be
 * directly invoked throught the command palette, but is invoked by
 * {@link ExportPodV2Command}
 */
export class GoogleDocsExportPodCommand extends BaseExportPodCommand<
  RunnableGoogleDocsV2PodConfig,
  GoogleDocsExportReturnType
> {
  public key = "dendron.googledocsexport";

  public constructor(extension: IDendronExtension) {
    super(new QuickPickHierarchySelector(), extension);
  }

  public createPod(
    config: RunnableGoogleDocsV2PodConfig
  ): ExportPodV2<GoogleDocsExportReturnType> {
    const { engine, wsRoot } = this.extension.getDWorkspace();
    const fpath = EngineUtils.getPortFilePathForWorkspace({ wsRoot });
    const port = openPortFile({ fpath });
    return new GoogleDocsExportPodV2({
      podConfig: config,
      engine,
      port,
    });
  }

  public getRunnableSchema(): JSONSchemaType<RunnableGoogleDocsV2PodConfig> {
    return createRunnableGoogleDocsV2PodConfigSchema();
  }

  async gatherInputs(
    opts?: Partial<GoogleDocsV2PodConfig & GoogleDocsConnection>
  ): Promise<RunnableGoogleDocsV2PodConfig | undefined> {
    let accessToken: string | undefined = opts?.accessToken;
    let refreshToken: string | undefined = opts?.refreshToken;
    let expirationTime: number | undefined = opts?.expirationTime;
    let connectionId: string | undefined = opts?.connectionId;
    const { wsRoot } = this.extension.getDWorkspace();
    // Get tokens and expiration time for gdoc services
    if (!accessToken || !refreshToken || !expirationTime || !connectionId) {
      const mngr = new ExternalConnectionManager(
        PodUtils.getPodDir({ wsRoot })
      );

      // If the tokens doesn't exist, see if we can first extract it from the connectedServiceId:
      if (opts?.connectionId) {
        const config = mngr.getConfigById<GoogleDocsConnection>({
          id: opts.connectionId,
        });

        if (!config) {
          window.showErrorMessage(
            `Couldn't find service config with the passed in connection ID ${opts.connectionId}.`
          );
          return;
        }
        accessToken = config.accessToken;
        refreshToken = config.refreshToken;
        expirationTime = config.expirationTime;
        connectionId = config.connectionId;
      } else {
        // Prompt User to pick an gdoc connection, or create a new one
        // (which will stop execution of current pod command)
        const connection =
          await PodUIControls.promptForExternalServiceConnectionOrNew<GoogleDocsConnection>(
            ExternalService.GoogleDocs
          );

        if (!connection) {
          return;
        }

        connectionId = connection.connectionId;
        accessToken = connection.accessToken;
        refreshToken = connection.refreshToken;
        expirationTime = connection.expirationTime;
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

    let parentFolderId = opts?.parentFolderId;
    if (_.isUndefined(parentFolderId)) {
      /** refreshes token if token has already expired */
      if (Time.now().toSeconds() > expirationTime) {
        const { wsRoot } = this.extension.getDWorkspace();
        const fpath = EngineUtils.getPortFilePathForWorkspace({ wsRoot });
        const port = openPortFile({ fpath });
        accessToken = await PodUtils.refreshGoogleAccessToken(
          refreshToken,
          port,
          connectionId
        );
      }
      const folderIdsHashMap = await this.candidateForParentFolders(
        accessToken
      );
      const folders = Object.keys(folderIdsHashMap);
      const parentFolder =
        folders.length > 1
          ? await this.promtForParentFolderId(Object.keys(folderIdsHashMap))
          : "root";
      if (_.isUndefined(parentFolder)) return;
      parentFolderId = folderIdsHashMap[parentFolder];
    }

    const inputs = {
      exportScope,
      accessToken,
      refreshToken,
      ...opts,
      podType: PodV2Types.GoogleDocsExportV2,
      expirationTime,
      connectionId,
      parentFolderId,
    };

    // If this is not an already saved pod config, then prompt user whether they
    // want to save as a new config or just run it one-time
    if (!opts?.podId) {
      const choice = await PodUIControls.promptToSaveInputChoicesAsNewConfig();
      if (choice !== undefined && choice !== false) {
        const configPath = ConfigFileUtils.genConfigFileV2({
          fPath: PodUtils.getCustomConfigPath({ wsRoot, podId: choice }),
          configSchema: GoogleDocsExportPodV2.config(),
          setProperties: _.merge(inputs, {
            podId: choice,
            podType: PodV2Types.GoogleDocsExportV2,
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

    if (!isRunnableGoogleDocsV2PodConfig(inputs)) {
      const id = await PodUIControls.promptToCreateNewServiceConfig(
        ExternalService.GoogleDocs
      );
      await launchGoogleOAuthFlow(id);
      vscode.window.showInformationMessage(
        "Google OAuth is a beta feature. Please contact us at support@dendron.so or on Discord to first gain access. Then, try again and authenticate with Google on your browser to continue."
      );
      return;
    } else {
      return inputs;
    }
  }

  async candidateForParentFolders(accessToken: string) {
    try {
      const result = await this.getAllFoldersInDrive(accessToken);
      return result;
    } catch (err: any) {
      this.L.error(stringifyError(err));
      return { root: "root" };
    }
  }

  /**
   * sends request to drive API to fetch folders
   */
  async getAllFoldersInDrive(accessToken: string) {
    const folderIdsHashMap = await window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: "Fetching Parent Folders...",
        cancellable: false,
      },
      async () => {
        const headers = {
          Authorization: `Bearer ${accessToken}`,
        };
        const result = await axios.get(
          `https://www.googleapis.com/drive/v3/files`,
          {
            params: {
              q: "mimeType= 'application/vnd.google-apps.folder'",
            },
            headers,
            timeout: 5000,
          }
        );
        const files = result?.data.files;
        let folderIdsHashMap: { [key: string]: string } = { root: "root" };

        //creates HashMap of documents with key as doc name and value as doc id
        files.forEach((file: any) => {
          folderIdsHashMap = {
            ...folderIdsHashMap,
            [file.name]: file.id,
          };
        });
        return folderIdsHashMap;
      }
    );
    return folderIdsHashMap;
  }

  /**
   * prompts to select the folder docs are exported to
   * @param folderIdsHashMap
   */
  async promtForParentFolderId(folderIdsHashMap: string[]) {
    const pickItems = folderIdsHashMap.map((folder) => {
      return {
        label: folder,
      };
    });
    const selected = await window.showQuickPick(pickItems, {
      placeHolder: "Choose the Destination Folder",
      ignoreFocusOut: true,
      matchOnDescription: true,
      canPickMany: false,
    });
    if (!selected) {
      return;
    }
    return selected.label;
  }

  async onExportComplete(opts: {
    exportReturnValue: GoogleDocsExportReturnType;
    payload: NoteProps[];
    config: RunnableGoogleDocsV2PodConfig;
  }) {
    const engine = this.extension.getEngine();
    const { exportReturnValue, config } = opts;
    let errorMsg = "";
    const createdDocs = exportReturnValue.data?.created?.filter((ent) => !!ent);
    const updatedDocs = exportReturnValue.data?.updated?.filter((ent) => !!ent);
    const createdCount = createdDocs?.length ?? 0;
    const updatedCount = updatedDocs?.length ?? 0;
    if (createdDocs && createdCount > 0) {
      await GoogleDocsUtils.updateNotesWithCustomFrontmatter(
        createdDocs,
        engine,
        config.parentFolderId
      );
    }
    if (updatedDocs && updatedCount > 0) {
      await GoogleDocsUtils.updateNotesWithCustomFrontmatter(
        updatedDocs,
        engine,
        config.parentFolderId
      );
    }
    if (ResponseUtil.hasError(exportReturnValue)) {
      errorMsg = `Finished GoogleDocs Export. ${createdCount} docs created; ${updatedCount} docs updated. Error encountered: ${ErrorFactory.safeStringify(
        exportReturnValue.error?.message
      )}`;

      this.L.error(errorMsg);
    } else {
      window.showInformationMessage(
        `Finished GoogleDocs Export. ${createdCount} docs created; ${updatedCount} docs updated.`
      );
    }
    return errorMsg;
  }
}
