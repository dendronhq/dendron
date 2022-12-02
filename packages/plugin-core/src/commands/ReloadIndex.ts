import {
  ConfigEvents,
  DEngineClient,
  DVault,
  ERROR_SEVERITY,
  FOLDERS,
  IDendronError,
  isNotUndefined,
  NoteUtils,
  SchemaUtils,
  VaultUtils,
  WorkspaceEvents,
  DuplicateNoteError,
  errorsList,
} from "@dendronhq/common-all";
import {
  getDurationMilliseconds,
  note2File,
  schemaModuleOpts2File,
  vault2Path,
} from "@dendronhq/common-server";
import { DoctorActionsEnum, DoctorService } from "@dendronhq/engine-server";
import fs from "fs-extra";
import _ from "lodash";
import path from "path";
import { ProgressLocation, window } from "vscode";
import { DENDRON_COMMANDS } from "../constants";
import { ExtensionProvider } from "../ExtensionProvider";
import { Logger } from "../logger";
import { IEngineAPIService } from "../services/EngineAPIServiceInterface";
import { AnalyticsUtils } from "../utils/analytics";
import { MessageSeverity, VSCodeUtils } from "../vsCodeUtils";
import { BasicCommand } from "./base";

enum AutoFixAction {
  CREATE_ROOT_SCHEMA = "create root schema",
  CREATE_ROOT_NOTE = "create root note",
}

export const FIX_CONFIG_SELF_CONTAINED = "Fix configuration";

function categorizeActions(actions: (AutoFixAction | undefined)[]) {
  return {
    [AutoFixAction.CREATE_ROOT_NOTE]: actions.filter(
      (item) => item === AutoFixAction.CREATE_ROOT_NOTE
    ).length,
    [AutoFixAction.CREATE_ROOT_SCHEMA]: actions.filter(
      (item) => item === AutoFixAction.CREATE_ROOT_SCHEMA
    ).length,
  };
}

type ReloadIndexCommandOpts = {
  silent?: boolean;
};

export class ReloadIndexCommand extends BasicCommand<
  ReloadIndexCommandOpts,
  DEngineClient | undefined
> {
  key = DENDRON_COMMANDS.RELOAD_INDEX.key;
  silent = true;

  /** Create the root schema if it is missing. */
  private async createRootSchemaIfMissing(
    wsRoot: string,
    vault: DVault
  ): Promise<undefined | AutoFixAction> {
    const ctx = "ReloadIndex.createRootSchemaIfMissing";
    const vaultDir = vault2Path({ wsRoot, vault });
    const rootSchemaPath = path.join(vaultDir, "root.schema.yml");
    // If it already exists, nothing to do
    if (await fs.pathExists(rootSchemaPath)) return;
    // If this is just a misconfigured self contained vault, skip it because we'll need to fix the config
    if (
      await fs.pathExists(path.join(vaultDir, FOLDERS.NOTES, "root.schema.yml"))
    )
      return;

    try {
      const schema = SchemaUtils.createRootModule({ vault });
      this.L.info({ ctx, vaultDir, msg: "creating root schema" });
      await schemaModuleOpts2File(schema, vaultDir, "root");
      return AutoFixAction.CREATE_ROOT_SCHEMA;
    } catch (err) {
      this.L.info({
        ctx,
        vaultDir,
        msg: "Error when creating root schema",
        err,
      });
      return;
    }
  }

  /** Creates the root note if it is missing. */
  private async createRootNoteIfMissing(
    wsRoot: string,
    vault: DVault
  ): Promise<undefined | AutoFixAction> {
    const ctx = "ReloadIndex.createRootNoteIfMissing";
    const vaultDir = vault2Path({ wsRoot, vault });
    const rootNotePath = path.join(vaultDir, "root.md");
    // If it already exists, nothing to do
    if (await fs.pathExists(rootNotePath)) return;
    // If this is just a misconfigured self contained vault, skip it because we'll need to fix the config
    if (await fs.pathExists(path.join(vaultDir, FOLDERS.NOTES, "root.md")))
      return;

    try {
      const note = NoteUtils.createRoot({ vault });
      this.L.info({ ctx, vaultDir, msg: "creating root note" });
      await note2File({
        note,
        vault,
        wsRoot,
      });
      return AutoFixAction.CREATE_ROOT_NOTE;
    } catch (err) {
      this.L.info({ ctx, vaultDir, msg: "Error when creating root note", err });
      return;
    }
  }

  /** Checks if there are any self contained vaults that aren't marked correctly, and prompts the user to fix the configuration. */
  static async checkAndPromptForMisconfiguredSelfContainedVaults({
    engine,
  }: {
    engine: IEngineAPIService;
  }) {
    const ctx = "checkAndPromptForMisconfiguredSelfContainedVaults";
    const ws = ExtensionProvider.getDWorkspace();
    const { wsRoot } = ws;
    const vaults = await ws.vaults;
    const doctor = new DoctorService();
    const vaultsToFix = await doctor.findMisconfiguredSelfContainedVaults(
      wsRoot,
      vaults
    );

    const fixConfig = FIX_CONFIG_SELF_CONTAINED;

    if (vaultsToFix.length > 0) {
      Logger.info({
        ctx,
        numVaultsToFix: vaultsToFix.length,
      });

      let message: string;
      let detail: string | undefined;
      if (vaultsToFix.length === 1) {
        message = `Vault "${VaultUtils.getName(
          vaultsToFix[0]
        )}" needs to be marked as a self contained vault in your configuration file.`;
      } else {
        message = `${vaultsToFix.length} vaults need to be marked as self contained vaults in your configuration file`;
      }
      AnalyticsUtils.track(ConfigEvents.MissingSelfContainedVaultsMessageShow, {
        vaultsToFix: vaultsToFix.length,
      });
      const pick = await window.showWarningMessage(
        message,
        {
          detail,
        },
        fixConfig,
        "Ignore for now"
      );
      Logger.info({
        ctx,
        msg: "Used picked an option in the fix prompt",
        pick,
      });
      if (pick === fixConfig) {
        AnalyticsUtils.trackForNextRun(
          ConfigEvents.MissingSelfContainedVaultsMessageAccept
        );
        await doctor.executeDoctorActions({
          action: DoctorActionsEnum.FIX_SELF_CONTAINED_VAULT_CONFIG,
          engine,
        });
        Logger.info({
          ctx,
          msg: "Fixing vaults done!",
        });
        // Need to reload because the vaults loaded are incorrect now
        VSCodeUtils.reloadWindow();
      }
    }
    doctor.dispose();
  }

  /**
   * Update index
   * @param opts
   */
  async execute(
    opts?: ReloadIndexCommandOpts
  ): Promise<DEngineClient | undefined> {
    const ctx = "ReloadIndex.execute";
    this.L.info({ ctx, msg: "enter" });
    const ws = ExtensionProvider.getDWorkspace();
    let initError: IDendronError | undefined;
    const { wsRoot, engine } = ws;

    // Check if there are any misconfigured self contained vaults.
    // Deliberately not awaiting this to avoid blocking the reload
    ReloadIndexCommand.checkAndPromptForMisconfiguredSelfContainedVaults({
      engine: ExtensionProvider.getEngine(),
    });

    // Fix up any broken vaults
    const reloadIndex = async () => {
      const autoFixActions = await Promise.all(
        engine.vaults.flatMap((vault) => {
          return [
            this.createRootSchemaIfMissing(wsRoot, vault),
            this.createRootNoteIfMissing(wsRoot, vault),
          ];
        })
      );
      if (autoFixActions.filter(isNotUndefined).length > 0) {
        AnalyticsUtils.track(WorkspaceEvents.AutoFix, {
          ...categorizeActions(autoFixActions),
          nonFatalInitError:
            initError && initError.severity === ERROR_SEVERITY.MINOR,
        });
      }

      const start = process.hrtime();
      const { error } = await engine.init();
      const durationEngineInit = getDurationMilliseconds(start);
      this.L.info({ ctx, durationEngineInit });

      // if fatal, stop initialization
      if (error && error.severity !== ERROR_SEVERITY.MINOR) {
        this.L.error({ ctx, error, msg: "unable to initialize engine" });
        return;
      }
      if (error) {
        // There may be one or more errors,
        const errors = errorsList(error);
        errors.forEach((error) => {
          if (DuplicateNoteError.isDuplicateNoteError(error) && error.code) {
            VSCodeUtils.showMessage(MessageSeverity.WARN, error.message, {});
            AnalyticsUtils.track(WorkspaceEvents.DuplicateNoteFound, {
              source: this.key,
            });
            this.L.info({ ctx, error, msg: "Duplicate note IDs found" });
          } else {
            // Warn about any errors not handled above
            this.L.error({
              ctx,
              error,
              msg: `Initialization error: ${error.message}`,
            });
          }
        });
        if (errors.length === 0) {
          // For backwards compatibility, warn if there are warnings that are
          // non-fatal errors not covered by the new error architecture
          this.L.error({ ctx, error, msg: "init error" });
        }
      }
      return autoFixActions;
    };

    if (!(opts && !opts.silent)) {
      await reloadIndex();
    } else {
      await window.withProgress(
        {
          location: ProgressLocation.Notification,
          title: "Reloading Index...",
          cancellable: false,
        },
        reloadIndex
      );
    }

    this.L.info({ ctx, msg: "exit", initError });
    return engine;
  }
}
