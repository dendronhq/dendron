import {
  assertUnreachable,
  DNodeProps,
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
import path from "path";
import * as vscode from "vscode";
import { HierarchySelector } from "../../components/lookup/HierarchySelector";
import { VSCodeUtils } from "../../vsCodeUtils";
import { getDWorkspace, getExtension } from "../../workspace";
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
    { config: Config; payload: string | NoteProps[] },
    any,
    Config,
    Partial<Config>
  >
  implements ExportPodFactory<Config, R>
{
  private hierarchySelector: HierarchySelector;

  /**
   *
   * @param hierarchySelector a user control that can return a selected
   * hierarchy to export. Should use {@link QuickPickHierarchySelector} by
   * default
   */
  constructor(hierarchySelector: HierarchySelector) {
    super();
    this.hierarchySelector = hierarchySelector;
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
   * Gather the appropriate input payload based on the specified export scope.
   * @param inputs
   * @returns
   */
  async enrichInputs(
    inputs: Config
  ): Promise<{ config: Config; payload: string | NoteProps[] } | undefined> {
    let payload: string | NoteProps[] | undefined;

    switch (inputs.exportScope) {
      case PodExportScope.Clipboard: {
        payload = await vscode.env.clipboard.readText();

        if (!payload || payload === "") {
          vscode.window.showWarningMessage(
            "Clipboard is either empty or not text - nothing to export."
          );
          return;
        }
        break;
      }
      case PodExportScope.Selection: {
        const activeRange = await VSCodeUtils.extractRangeFromActiveEditor();
        const { document, range } = activeRange || {};
        const selectedText = document ? document.getText(range).trim() : "";

        if (!selectedText || selectedText === "") {
          vscode.window.showWarningMessage(
            "No text has been selected - nothing to export."
          );
          return;
        }

        payload = selectedText;
        break;
      }
      case PodExportScope.Note: {
        payload = this.getNoteProps();

        if (!payload) {
          vscode.window.showErrorMessage("Unable to get note payload.");
          return;
        }
        break;
      }
      case PodExportScope.Hierarchy: {
        payload = await this.getHierarchyProps();

        if (!payload) {
          vscode.window.showErrorMessage("Unable to get hierarchy payload.");
          return;
        }
        break;
      }
      case PodExportScope.Workspace: {
        payload = this.getWorkspaceProps();

        if (!payload) {
          vscode.window.showErrorMessage("Unable to get workspace payload.");
          return;
        }
        break;
      }
      default:
        assertUnreachable();
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
  async execute(opts: { config: Config; payload: string | NoteProps[] }) {
    vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: "Running Export...",
        cancellable: true,
      },
      async (_progress, token) => {
        token.onCancellationRequested(() => {
          return;
        });

        const pod = this.createPod(opts.config);
        PodUtils.validate(opts.config, this.getRunnableSchema());

        switch (opts.config.exportScope) {
          case PodExportScope.Clipboard:
          case PodExportScope.Selection: {
            if (!pod.exportText) {
              throw new Error("Text export not supported by this pod!");
            } else if (typeof opts.payload === "string") {
              const strPayload = opts.payload;
              pod.exportText(strPayload).then((result) => {
                this.onExportComplete({
                  exportReturnValue: result,
                  payload: strPayload,
                  config: opts.config,
                });
              });
            } else {
              throw new Error("Invalid Payload Type in Text Export");
            }
            break;
          }
          case PodExportScope.Note: {
            const promises = [];

            for (const noteProp of opts.payload) {
              if (typeof noteProp === "string") {
                throw new Error("Invalid Payload Type in Pod Note Export");
              } else if (pod.exportNote) {
                promises.push(
                  pod.exportNote(noteProp).then((result) => {
                    this.onExportComplete({
                      exportReturnValue: result,
                      payload: noteProp,
                      config: opts.config,
                    });
                  })
                );
              } else {
                throw new Error("Invalid Payload Type in Text Export");
              }
            }
            break;
          }
          case PodExportScope.Hierarchy:
          case PodExportScope.Workspace: {
            if (typeof opts.payload === "string") {
              throw new Error("Invalid Payload Type in Pod Note Export");
            } else if (pod.exportNotes) {
              pod.exportNotes(opts.payload).then((result) => {
                this.onExportComplete({
                  exportReturnValue: result,
                  payload: opts.payload,
                  config: opts.config,
                });
              });
            } else {
              throw new Error("Multi Note Export not supported by this pod!");
            }

            break;
          }

          default:
            assertUnreachable();
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
    payload: string | NoteProps | NoteProps[];
    config: Config;
  }): void;

  /**
   * Gets notes matching the selected hierarchy
   * @returns
   */
  private async getHierarchyProps(): Promise<
    DNodeProps<any, any>[] | undefined
  > {
    return new Promise<DNodeProps<any, any>[] | undefined>((resolve) => {
      this.hierarchySelector.getHierarchy().then((selection) => {
        if (!selection) {
          return resolve(undefined);
        }

        const notes = getExtension().getEngine().notes;

        resolve(
          Object.values(notes).filter(
            (value) => value.fname.startsWith(selection) && value.stub !== true
          )
        );
      });
    });
  }

  private getNoteProps(): DNodeProps[] | undefined {
    //TODO: Switch this to a lookup controller, allow multiselect
    const fsPath = VSCodeUtils.getActiveTextEditor()?.document.uri.fsPath;
    if (!fsPath) {
      vscode.window.showErrorMessage(
        "you must have a note open to execute this command"
      );
      return;
    }

    const { vaults, engine, wsRoot } = getDWorkspace();

    const vault = VaultUtils.getVaultByFilePath({
      vaults,
      wsRoot,
      fsPath,
    });

    const fname = path.basename(fsPath, ".md");

    const maybeNote = NoteUtils.getNoteByFnameV5({
      fname,
      vault,
      notes: engine.notes,
      wsRoot,
    }) as NoteProps;

    if (!maybeNote) {
      vscode.window.showErrorMessage("couldn't find the note somehow");
    }
    return [maybeNote!];
  }

  /**
   *
   * @returns all notes in the workspace
   */
  private getWorkspaceProps(): DNodeProps[] | undefined {
    const { engine } = getDWorkspace();
    return Object.values(engine.notes);
  }
}
