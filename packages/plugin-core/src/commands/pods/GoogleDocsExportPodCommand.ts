import { NoteProps, ResponseUtil } from "@dendronhq/common-all";
import {
  ConfigFileUtils,
  ExportPodV2,
  ExternalConnectionManager,
  ExternalService,
  GoogleDocsConnection,
  GoogleDocsExportPodV2,
  GoogleDocsExportReturnType,
  GoogleDocsV2PodConfig,
  isRunnableGoogleDocsV2PodConfig,
  PodV2Types,
  RunnableGoogleDocsV2PodConfig,
} from "@dendronhq/pods-core";
import _ from "lodash";
import path from "path";
import * as vscode from "vscode";
import { window } from "vscode";
import { PodUIControls } from "../../components/pods/PodControls";
import { clipboard, VSCodeUtils } from "../../utils";
import { getDWorkspace, getEngine, getExtension } from "../../workspace";
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

  public createPod(
    config: RunnableGoogleDocsV2PodConfig
  ): ExportPodV2<GoogleDocsExportReturnType> {
    const { wsRoot, vaults } = getDWorkspace();

    return new GoogleDocsExportPodV2({
      podConfig: config,
      engine: getEngine(),
      wsRoot,
      vaults,
    });
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
    if (!isRunnableGoogleDocsV2PodConfig(inputs)) {
      let id = inputs?.podId;
      if (!id) {
        const picked = await PodUIControls.promptForGenericId();

        if (!picked) {
          return;
        }
        id = picked;
      }
      const configPath = ConfigFileUtils.genConfigFileV2({
        fPath: path.join(getExtension().podsDir, "custom", `config.${id}.yml`),
        configSchema: GoogleDocsExportPodV2.config(),
        setProperties: _.merge(inputs, {
          podId: id,
          connectionId: inputs.connectionId,
        }),
      });
      await VSCodeUtils.openFileInEditor(vscode.Uri.file(configPath));
      //TODO: Modify message:
      return;
    } else {
      return inputs;
    }
  }

  async onExportComplete(opts: {
    exportReturnValue: GoogleDocsExportReturnType;
    payload: NoteProps;
    config: RunnableGoogleDocsV2PodConfig;
  }) {
    const { exportReturnValue, payload } = opts;
    if (ResponseUtil.hasError(exportReturnValue)) {
      this.L.error(exportReturnValue.error);
      window.showErrorMessage(
        "Error while running Google Docs Export Pod: " + exportReturnValue
      );
      return;
    }
    if (exportReturnValue.data?.documentId) {
      await this.updateNoteWithDocumentId({
        documentId: exportReturnValue.data?.documentId,
        note: payload,
      });
    }
    const gdocLink = `https://docs.google.com/document/d/${exportReturnValue.data?.documentId}`;
    clipboard.writeText(gdocLink);
    vscode.window.showInformationMessage(
      `Finished running Google Docs export pod. The doc ${payload.fname} is created in your selected google docs account and link is copied to the clipboard.`
    );
  }

  async updateNoteWithDocumentId(opts: {
    documentId: string;
    note: NoteProps;
  }) {
    const { documentId, note } = opts;
    const engine = getEngine();
    note.custom = {
      ...note.custom,
      documentId,
    };
    await engine.writeNote(note, { updateExisting: true });
  }
}
