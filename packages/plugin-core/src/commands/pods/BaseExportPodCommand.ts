/* eslint-disable no-await-in-loop */
import {
  assertUnreachable,
  DendronError,
  DNodeProps,
  DVault,
  IProgress,
  IProgressStep,
  NoteChangeEntry,
  NoteProps,
  NoteUtils,
  VaultUtils,
} from "@dendronhq/common-all";
import {
  ExportPodFactory,
  ExportPodV2,
  JSONSchemaType,
  PodExportScope,
  PodUtils,
  RunnablePodConfigV2,
} from "@dendronhq/pods-core";
import _ from "lodash";
import path from "path";
import * as vscode from "vscode";
import { HierarchySelector } from "../../components/lookup/HierarchySelector";
import { PodUIControls } from "../../components/pods/PodControls";
import { IDendronExtension } from "../../dendronExtensionInterface";
import { VSCodeUtils } from "../../vsCodeUtils";
import { BaseCommand } from "../base";

/**
 * Abstract base class for export pod commands. This class will defer input
 * gathering to derived classes.  In EnrichInputs(), it is responsible for
 * gathering the appropriate input payload. Finally, in execute(), it will
 * construct the derived class' corresponding Pod, and invoke the appropriate
 * export() function based on the specified export scope.
 * @template Config - the type of {@link RunnablePodConfigV2} for the export operation
 * @template R - the return type of the export() operation
 */
export abstract class BaseExportPodCommand<
    Config extends RunnablePodConfigV2,
    R
  >
  extends BaseCommand<
    { config: Config; payload: NoteProps[] },
    any,
    Config,
    Partial<Config>
  >
  implements ExportPodFactory<Config, R>, vscode.Disposable
{
  private hierarchySelector: HierarchySelector;
  private _onEngineNoteStateChangedDisposable: vscode.Disposable | undefined;
  public extension: IDendronExtension;

  /**
   *
   * @param hierarchySelector a user control that can return a selected
   * hierarchy to export. Should use {@link QuickPickHierarchySelector} by
   * default
   */
  constructor(
    hierarchySelector: HierarchySelector,
    extension: IDendronExtension
  ) {
    super();
    this.hierarchySelector = hierarchySelector;
    this.extension = extension;
  }

  /**
   * Provide a pod factory method to instantiate the pod instance with the
   * passed in configuration
   * @param config
   */
  public abstract createPod(config: Config): ExportPodV2<R>;

  /**
   * Provide a method to get ajv schema of runnable pod config
   */
  public abstract getRunnableSchema(): JSONSchemaType<Config>;

  /**
   * checks if the destination is compatible with export scope
   */
  public multiNoteExportCheck(opts: {
    destination: string;
    exportScope: PodExportScope;
  }) {
    if (
      opts.destination === "clipboard" &&
      opts.exportScope !== PodExportScope.Note &&
      opts.exportScope !== PodExportScope.Selection
    ) {
      throw new DendronError({
        message:
          "Multi Note Export cannot have clipboard as destination. Please configure your destination by using Dendron: Configure Export Pod V2 command",
      });
    }
  }

  public dispose(): void {
    if (this._onEngineNoteStateChangedDisposable) {
      this._onEngineNoteStateChangedDisposable.dispose();
      this._onEngineNoteStateChangedDisposable = undefined;
    }
  }

  /**
   * Gather the appropriate input payload based on the specified export scope.
   * @param inputs
   * @returns
   */
  async enrichInputs(
    inputs: Config
  ): Promise<{ config: Config; payload: NoteProps[] } | undefined> {
    let payload: NoteProps[] | undefined;

    switch (inputs.exportScope) {
      case PodExportScope.Lookup:
      case PodExportScope.LinksInSelection: {
        const scope = await PodUIControls.promptForScopeLookup({
          fromSelection: inputs.exportScope === PodExportScope.LinksInSelection,
          key: this.key,
          logger: this.L,
        });
        if (scope === undefined) {
          vscode.window.showErrorMessage("Unable to get notes payload.");
          return;
        }
        payload = scope.selectedItems.map((item) => {
          return _.omit(item, ["label", "detail", "alwaysShow"]) as NoteProps;
        });
        if (!payload) {
          vscode.window.showErrorMessage("Unable to get notes payload.");
          return;
        }
        break;
      }
      case PodExportScope.Note: {
        payload = await this.getPropsForNoteScope();

        if (!payload) {
          vscode.window.showErrorMessage("Unable to get note payload.");
          return;
        }
        break;
      }
      case PodExportScope.Hierarchy: {
        payload = await this.getPropsForHierarchyScope();

        if (!payload) {
          vscode.window.showErrorMessage("Unable to get hierarchy payload.");
          return;
        }
        break;
      }
      case PodExportScope.Vault: {
        const vault = await PodUIControls.promptForVaultSelection();
        if (!vault) {
          vscode.window.showErrorMessage("Unable to get vault payload.");
          return;
        }
        payload = await this.getPropsForVaultScope(vault);

        if (!payload) {
          vscode.window.showErrorMessage("Unable to get vault payload.");
          return;
        }
        break;
      }
      case PodExportScope.Workspace: {
        payload = await this.getPropsForWorkspaceScope();

        if (!payload) {
          vscode.window.showErrorMessage("Unable to get workspace payload.");
          return;
        }
        break;
      }
      case PodExportScope.Selection: {
        payload = await this.getPropsForSelectionScope();

        if (!payload) {
          return;
        }
        break;
      }
      default:
        assertUnreachable(inputs.exportScope);
    }

    return {
      payload,
      config: inputs,
    };
  }

  /**
   * Construct the pod and perform export for the appropriate payload scope.
   * @param opts
   */
  async execute(opts: { config: Config; payload: NoteProps[] }) {
    PodUtils.validate(opts.config, this.getRunnableSchema());
    vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: "Running Export ",
        cancellable: true,
      },
      async (_progress, token) => {
        token.onCancellationRequested(() => {
          return;
        });

        switch (opts.config.exportScope) {
          case PodExportScope.Note:
          case PodExportScope.Selection:
            this.saveActiveDocumentBeforeExporting(opts);
            break;
          case PodExportScope.Vault:
          case PodExportScope.Lookup:
          case PodExportScope.LinksInSelection:
          case PodExportScope.Hierarchy:
          case PodExportScope.Workspace: {
            await this.executeExportNotes(opts, _progress);

            break;
          }

          default:
            assertUnreachable(opts.config.exportScope);
        }
      }
    );
  }
  /**
   * Executed after export is complete. If multiple notes are being exported,
   * this is invoked on each exported note.
   * @param param0
   */
  abstract onExportComplete({
    exportReturnValue,
    payload,
    config,
  }: {
    exportReturnValue: R;
    payload: NoteProps[];
    config: Config;
  }): Promise<void | string>;

  /**
   * Gets notes matching the selected hierarchy(for a specefic vault)
   * @returns
   */
  private async getPropsForHierarchyScope(): Promise<NoteProps[] | undefined> {
    return this.hierarchySelector.getHierarchy().then(async (selection) => {
      if (!selection) {
        return undefined;
      }
      const { hierarchy, vault } = selection;
      const notes = await this.extension
        .getEngine()
        .findNotes({ excludeStub: true, vault });

      return notes.filter((value) => value.fname.startsWith(hierarchy));
    });
  }

  /**
   * If the active text editor document has dirty changes, save first before exporting
   * @returns True if document is dirty, false otherwise
   */
  private async saveActiveDocumentBeforeExporting(opts: {
    config: Config;
    payload: NoteProps[];
  }): Promise<boolean> {
    const editor = VSCodeUtils.getActiveTextEditor();
    if (editor && editor.document.isDirty) {
      const fname = NoteUtils.uri2Fname(editor.document.uri);
      this._onEngineNoteStateChangedDisposable = this.extension
        .getEngine()
        .engineEventEmitter.onEngineNoteStateChanged(
          async (noteChangeEntries: NoteChangeEntry[]) => {
            const updateNoteEntries = noteChangeEntries.filter(
              (entry) => entry.note.fname === fname && entry.status === "update"
            );
            // Received event from engine about successful save
            if (updateNoteEntries.length > 0) {
              this.dispose();
              const savedNote = updateNoteEntries[0].note;
              // Remove notes that match saved note as they contain old content
              const filteredPayload = opts.payload.filter(
                (note) => note.fname !== savedNote.fname
              );
              // if export scope is selection, export only the selection
              if (opts.config.exportScope === PodExportScope.Selection) {
                const selectionPayload = await this.getPropsForSelectionScope(
                  filteredPayload.concat(savedNote)
                );
                if (selectionPayload) {
                  opts.payload = selectionPayload;
                  await this.executeExportNotes(opts);
                }
              } else {
                await this.executeExportNotes(opts);
              }
            }
          }
        );
      await editor.document.save();
      // Dispose of listener after 3 sec (if not already disposed) in case engine events never arrive
      setTimeout(() => {
        if (this._onEngineNoteStateChangedDisposable) {
          vscode.window.showErrorMessage(
            `Unable to run export. Please save file and try again.`
          );
        }
        this.dispose();
      }, 3000);

      return true;
    } else {
      // Save is not needed. Go straight to exporting
      await this.executeExportNotes(opts);
      return false;
    }
  }

  private async executeExportNotes(
    opts: {
      config: Config;
      payload: NoteProps[];
    },
    progress?: IProgress<IProgressStep>
  ): Promise<string | void> {
    const pod = this.createPod(opts.config);
    const result = await pod.exportNotes(opts.payload, progress);
    return this.onExportComplete({
      exportReturnValue: result,
      payload: opts.payload,
      config: opts.config,
    });
  }

  private async getPropsForNoteScope(): Promise<DNodeProps[] | undefined> {
    //TODO: Switch this to a lookup controller, allow multiselect
    const fsPath = VSCodeUtils.getActiveTextEditor()?.document.uri.fsPath;
    if (!fsPath) {
      vscode.window.showErrorMessage(
        "you must have a note open to execute this command"
      );
      return;
    }

    const { vaults, engine, wsRoot } = this.extension.getDWorkspace();

    const vault = VaultUtils.getVaultByFilePath({
      vaults,
      wsRoot,
      fsPath,
    });

    const fname = path.basename(fsPath, ".md");

    const maybeNote = (await engine.findNotes({ fname, vault }))[0];

    if (!maybeNote) {
      vscode.window.showErrorMessage("couldn't find the note somehow");
    }
    return [maybeNote];
  }

  /**
   *
   * @returns all notes in the workspace
   */
  private async getPropsForWorkspaceScope(): Promise<DNodeProps[]> {
    const engine = this.extension.getEngine();
    return engine.findNotes({ excludeStub: true });
  }

  /**
   *
   * @returns all notes in the vault
   */
  private async getPropsForVaultScope(vault: DVault): Promise<DNodeProps[]> {
    const engine = this.extension.getEngine();
    return engine.findNotes({ excludeStub: true, vault });
  }

  addAnalyticsPayload(opts: { config: Config; payload: NoteProps[] }) {
    if (_.isUndefined(opts)) return;
    return {
      exportScope: opts.config.exportScope,
    };
  }

  async getPropsForSelectionScope(payload?: NoteProps[]) {
    const noteProps = payload || (await this.getPropsForNoteScope());
    if (!noteProps) {
      return;
    }
    // if selection, only export the selection.
    const activeRange = await VSCodeUtils.extractRangeFromActiveEditor();
    const { document, range } = activeRange || {};
    const selectedText = document ? document.getText(range).trim() : "";
    if (!selectedText) {
      vscode.window.showWarningMessage(
        "Please select the text in note to export"
      );
      return;
    }
    noteProps[0].body = selectedText;
    return noteProps;
  }
}
