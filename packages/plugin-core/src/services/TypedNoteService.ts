import {
  DendronError,
  ERROR_SEVERITY,
  NoteType,
  ResponseUtil,
  RespV2,
} from "@dendronhq/common-all";
import * as vscode from "vscode";
import { CommandRegistrar } from "./CommandRegistrar";

/**
 * Interface for a service that manages Note Types
 * TODO: Figure out how to split functionality here such that some can move to engine-server while plugin-specific func stays in plugin-core
 * TODO: Expand functionality to cover more advanced typed functionality such as note lifecycle events
 */
export type TypedNoteService = {
  /**
   * Contains list of registered Note Types
   */
  readonly registeredTypes: NoteType[];

  /**
   * Register a New Note Type
   * @param type
   */
  registerType(type: NoteType): RespV2<void>;

  /**
   * Unregister an Existing Note Type
   * @param type
   */
  unregisterType(type: NoteType): RespV2<void>;

  /**
   * Returns the VS Code command that will create a note for the specified when
   * the command is run.
   * @param type
   */
  getRegisteredCommandForType(type: NoteType): string | undefined;
};

export class TypedNoteManager implements TypedNoteService {
  private cmdRegistar: CommandRegistrar;
  registeredTypes: NoteType[] = [];

  constructor(context: vscode.ExtensionContext) {
    this.cmdRegistar = new CommandRegistrar(context);
  }

  registerType(type: NoteType): RespV2<void> {
    if (
      this.registeredTypes.find((registered) => registered.id === type.id) !==
      undefined
    ) {
      return ResponseUtil.createUnhappyResponse({
        error: new DendronError({
          message: `Type with ID ${type.id} has already been registered`,
          severity: ERROR_SEVERITY.MINOR,
        }),
      });
    }

    this.registeredTypes = this.registeredTypes.concat(type);
    this.cmdRegistar.registerCommandForType(type);
    return { error: null };
  }

  unregisterType(_type: NoteType): RespV2<void> {
    throw new Error("Method not implemented.");
  }

  getTypesWithRegisteredCallback(_callbackType: callbackType): NoteType[] {
    throw new Error("Method not implemented.");
  }

  getRegisteredCommandForType(type: NoteType): string | undefined {
    if (type.id in this.cmdRegistar.registeredCommands) {
      return this.cmdRegistar.registeredCommands[type.id];
    }

    return undefined;
  }
}

/**
 * Not used yet
 */
export enum callbackType {
  onDescendantLifecycleEvent,
  onSiblingLifecycleEvent,
}
