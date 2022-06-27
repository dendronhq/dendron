import {
  asyncLoopOneAtATime,
  CONSTANTS,
  DendronError,
  ERROR_SEVERITY,
  NoteTrait,
  OnCreateContext,
  ResponseUtil,
  RespV2,
  VSCodeEvents,
} from "@dendronhq/common-all";
import path from "path";
import { ExtensionProvider } from "../ExtensionProvider";
import { UserDefinedTraitV1 } from "../traits/UserDefinedTraitV1";
import { CommandRegistrar } from "./CommandRegistrar";
import { NoteTraitService } from "./NoteTraitService";
import fs from "fs-extra";
import { Logger } from "../logger";
import * as vscode from "vscode";
import { AnalyticsUtils } from "../utils/analytics";
import _ from "lodash";

export class NoteTraitManager implements NoteTraitService, vscode.Disposable {
  private cmdRegistar: CommandRegistrar;
  private L = Logger;
  private _watcher: vscode.FileSystemWatcher | undefined;

  constructor(private _wsRoot: string, registrar: CommandRegistrar) {
    this.cmdRegistar = registrar;
    this.registeredTraits = new Map<string, NoteTrait>();
  }

  /**
   * Loads up saved note traits and sets up a filewatcher on trait .js files
   */
  async initialize(): Promise<void> {
    this.L.info("NoteTraitManager.initialize");
    await this.setupSavedTraitsFromFS();
    await this.setupFileWatcherForTraitFileChanges();
  }

  registeredTraits: Map<string, NoteTrait>;

  registerTrait(trait: NoteTrait): RespV2<void> {
    this.L.info("NoteTraitManager.registerTrait");
    if (this.registeredTraits.has(trait.id)) {
      return ResponseUtil.createUnhappyResponse({
        error: new DendronError({
          message: `Type with ID ${trait.id} has already been registered`,
          severity: ERROR_SEVERITY.MINOR,
        }),
      });
    }

    // During registration, do a test execution of each function to make sure
    // it's valid TS/JS and doesn't throw.
    const testContext: OnCreateContext = {
      currentNoteName: "foo.bar",
      selectedText: "text",
      clipboard: "clipboard",
    };

    if (trait.OnCreate?.setTitle) {
      try {
        trait.OnCreate.setTitle(testContext);
      } catch (error: any) {
        return ResponseUtil.createUnhappyResponse({
          error: new DendronError({
            message: `Error in OnCreate.setTitle function.`,
            innerError: error,
          }),
        });
      }
    }

    if (trait.OnCreate?.setTemplate) {
      try {
        trait.OnCreate.setTemplate();
      } catch (error: any) {
        return ResponseUtil.createUnhappyResponse({
          error: new DendronError({
            message: `Error in OnCreate.setTemplate function.`,
            innerError: error,
          }),
        });
      }
    }

    if (trait.OnWillCreate?.setNameModifier) {
      try {
        trait.OnWillCreate.setNameModifier(testContext);
      } catch (error: any) {
        return ResponseUtil.createUnhappyResponse({
          error: new DendronError({
            message: `Error in OnWillCreate.setNameModifier function.`,
            innerError: error,
          }),
        });
      }
    }

    this.registeredTraits.set(trait.id, trait);

    try {
      this.cmdRegistar.registerCommandForTrait(trait);
    } catch (error: any) {
      this.L.info("NoteTraitManager.registerTrait - ERROR" + error.toString());
      return { error };
    }
    return { error: null };
  }

  unregisterTrait(trait: NoteTrait): RespV2<void> {
    this.L.info("NoteTraitManager.unregisterTrait");
    this.cmdRegistar.unregisterTrait(trait);
    this.registeredTraits.delete(trait.id);

    return { error: null };
  }

  getTypesWithRegisteredCallback(_callbackType: callbackType): NoteTrait[] {
    throw new Error("Method not implemented.");
  }

  getRegisteredCommandForTrait(trait: NoteTrait): string | undefined {
    if (trait.id in this.cmdRegistar.registeredCommands) {
      return this.cmdRegistar.registeredCommands[trait.id];
    }

    return undefined;
  }

  dispose() {
    if (this._watcher) {
      this._watcher.dispose();
    }
  }

  // ^6fjseznl6au4
  private async setupSavedTraitsFromFS() {
    this.L.info("NoteTraitManager.setupSavedTraitsFromFS");
    const { wsRoot } = ExtensionProvider.getDWorkspace();

    const userTraitsPath = wsRoot
      ? path.join(wsRoot, CONSTANTS.DENDRON_USER_NOTE_TRAITS_BASE)
      : undefined;

    if (userTraitsPath && fs.pathExistsSync(userTraitsPath)) {
      const files = fs.readdirSync(userTraitsPath);

      // Track some info about how many and what kind of traits users have
      let traitJSFileCount = 0;
      let traitInitializedCount = 0;
      let traitHasSetTitleImplCount = 0;
      let traitHasSetNameModifierImplCount = 0;
      let traitHasSetTemplateImplCount = 0;

      asyncLoopOneAtATime(files, async (file) => {
        if (file.endsWith(".js")) {
          traitJSFileCount += 1;

          const resp = await this.setupTraitFromJSFile(
            path.join(userTraitsPath, file)
          );

          // Don't log an error at this point since we're just initializing - if
          // a user has some old trait files with errors in their workspace,
          // don't warn about trait errors until they try to actually use it.
          if (!ResponseUtil.hasError(resp)) {
            traitInitializedCount += 1;

            const newNoteTrait = resp.data;

            if (newNoteTrait?.OnCreate?.setTitle) {
              traitHasSetTitleImplCount += 1;
            }

            if (newNoteTrait?.OnCreate?.setTemplate) {
              traitHasSetTemplateImplCount += 1;
            }

            if (newNoteTrait?.OnWillCreate?.setNameModifier) {
              traitHasSetNameModifierImplCount += 1;
            }
          }
        }
      });

      if (traitJSFileCount > 0) {
        AnalyticsUtils.track(VSCodeEvents.NoteTraitsInitialized, {
          traitJSFileCount,
          traitInitializedCount,
          traitHasSetTitleImplCount,
          traitHasSetNameModifierImplCount,
          traitHasSetTemplateImplCount,
        });
      }
    }
  }

  private async setupTraitFromJSFile(
    fsPath: string
  ): Promise<RespV2<NoteTrait>> {
    const traitId = path.basename(fsPath, ".js");

    this.L.info("NoteTraitManager.setupTraitFromJSFile");
    this.L.info("Registering User Defined Note Trait with ID " + traitId);
    const newNoteTrait = new UserDefinedTraitV1(traitId, fsPath);

    try {
      await newNoteTrait.initialize();
    } catch (error: any) {
      return {
        error: new DendronError({
          message: `Error in ${path.basename(fsPath)} file.`,
          innerError: error,
        }),
      };
    }

    const resp = this.registerTrait(newNoteTrait);

    return {
      data: newNoteTrait,
      error: resp.error,
    };
  }

  private async setupFileWatcherForTraitFileChanges() {
    this.L.info("NoteTraitManager.setupFileWatcherForTraitFileChanges");
    const userTraitsPath = this._wsRoot
      ? path.join(this._wsRoot, CONSTANTS.DENDRON_USER_NOTE_TRAITS_BASE)
      : undefined;

    if (!userTraitsPath) {
      return;
    }

    const pattern = new vscode.RelativePattern(userTraitsPath, "*.js");

    this._watcher = vscode.workspace.createFileSystemWatcher(
      pattern,
      false,
      false,
      false
    );

    this._watcher.onDidCreate((uri) => {
      this.setupTraitFromJSFile(uri.fsPath);
    });

    this._watcher.onDidChange(
      // Need to debounce this, for some reason it fires 4 times each save
      _.debounce(
        async (uri) => {
          const traitId = path.basename(uri.fsPath, ".js");

          // First unregister if it exists already (and then re-register)
          if (this.registeredTraits.has(traitId)) {
            this.unregisterTrait(this.registeredTraits.get(traitId)!);
          }

          const resp = await this.setupTraitFromJSFile(uri.fsPath);

          if (ResponseUtil.hasError(resp)) {
            const errMessage = `${resp.error?.message}\n${resp.error?.innerError?.stack}`;
            vscode.window.showErrorMessage(errMessage);
          } else {
            vscode.window.showInformationMessage(
              `Note trait ${traitId} successfully registered.`
            );
          }
        },
        500, // 500 ms debounce interval
        {
          trailing: true,
          leading: false,
        }
      )
    );

    this._watcher.onDidDelete((uri) => {
      const traitId = path.basename(uri.fsPath, ".js");

      if (this.registeredTraits.has(traitId)) {
        this.unregisterTrait(this.registeredTraits.get(traitId)!);
      }
    });
  }
}

/**
 * Not used yet
 */
enum callbackType {
  onDescendantLifecycleEvent,
  onSiblingLifecycleEvent,
}
