import { ErrorFactory, NoteProps, ResponseUtil } from "@dendronhq/common-all";
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
  PodV2Types,
  RunnableGoogleDocsV2PodConfig,
  Source,
} from "@dendronhq/pods-core";
import _ from "lodash";
import path from "path";
import * as vscode from "vscode";
import { window } from "vscode";
import { QuickPickHierarchySelector } from "../../components/lookup/HierarchySelector";
import { PodUIControls } from "../../components/pods/PodControls";
import { ExtensionProvider } from "../../ExtensionProvider";
import { launchGoogleOAuthFlow } from "../../utils/pods";
import { VSCodeUtils } from "../../vsCodeUtils";
import { getExtension } from "../../workspace";
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

  public constructor() {
    super(new QuickPickHierarchySelector());
  }

  public createPod(
    config: RunnableGoogleDocsV2PodConfig
  ): ExportPodV2<GoogleDocsExportReturnType> {
    return new GoogleDocsExportPodV2({
      podConfig: config,
      engine: ExtensionProvider.getEngine(),
      source: Source.PLUGIN
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

    // Get tokens and expiration time for gdoc services
    if (!accessToken || !refreshToken || !expirationTime || !connectionId) {
      const mngr = new ExternalConnectionManager(getExtension().podsDir);

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

    const inputs = {
      exportScope,
      accessToken,
      refreshToken,
      ...opts,
      podType: PodV2Types.GoogleDocsExportV2,
      expirationTime,
      connectionId,
    };

    // If this is not an already saved pod config, then prompt user whether they
    // want to save as a new config or just run it one-time
    if (!opts?.podId) {
      const choice = await PodUIControls.promptToSaveInputChoicesAsNewConfig();

      if (choice !== undefined && choice !== false) {
        const configPath = ConfigFileUtils.genConfigFileV2({
          fPath: path.join(
            getExtension().podsDir,
            "custom",
            `config.${choice}.yml`
          ),
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

  async onExportComplete(opts: {
    exportReturnValue: GoogleDocsExportReturnType;
    payload: NoteProps[];
    config: RunnableGoogleDocsV2PodConfig;
  }) {
    const engine = ExtensionProvider.getEngine();
    const { exportReturnValue } = opts;
    let errorMsg = "";
    const createdDocs = exportReturnValue.data?.created?.filter((ent) => !!ent);
    const updatedDocs = exportReturnValue.data?.updated?.filter((ent) => !!ent);
    const createdCount = createdDocs?.length ?? 0;
    const updatedCount = updatedDocs?.length ?? 0;
    if (createdDocs && createdCount > 0) {
      await GoogleDocsUtils.updateNoteWithCustomFrontmatter(
        createdDocs,
        engine
      );
    }
    if (updatedDocs && updatedCount > 0) {
      await GoogleDocsUtils.updateNoteWithCustomFrontmatter(
        updatedDocs,
        engine
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
