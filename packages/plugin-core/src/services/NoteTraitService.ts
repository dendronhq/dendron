import {
  DendronError,
  ERROR_SEVERITY,
  NoteTrait,
  ResponseUtil,
  RespV2,
} from "@dendronhq/common-all";
import * as vscode from "vscode";
import { CommandRegistrar } from "./CommandRegistrar";

/**
 * Interface for a service that manages Note Traits
 * TODO: Figure out how to split functionality here such that some can move to engine-server while plugin-specific func stays in plugin-core
 * TODO: Expand functionality to cover more advanced typed functionality such as note lifecycle events
 */
export type NoteTraitService = {
  /**
   * Contains list of registered Note Traits
   */
  readonly registeredTraits: NoteTrait[];

  /**
   * Register a New Note Trait
   * @param type
   */
  registerTrait(type: NoteTrait): RespV2<void>;

  /**
   * Unregister an Existing Note Trait
   * @param type
   */
  unregisterTrait(type: NoteTrait): RespV2<void>;

  /**
   * Returns the VS Code command that will create a note for the specified when
   * the command is run.
   * @param type
   */
  getRegisteredCommandForTrait(type: NoteTrait): string | undefined;
};

export class NoteTraitManager implements NoteTraitService {
  private cmdRegistar: CommandRegistrar;
  registeredTraits: NoteTrait[] = [];

  constructor(registrar: CommandRegistrar) {
    this.cmdRegistar = registrar;
  }

  registerTrait(type: NoteTrait): RespV2<void> {
    if (
      this.registeredTraits.find((registered) => registered.id === type.id) !==
      undefined
    ) {
      return ResponseUtil.createUnhappyResponse({
        error: new DendronError({
          message: `Type with ID ${type.id} has already been registered`,
          severity: ERROR_SEVERITY.MINOR,
        }),
      });
    }

    this.registeredTraits = this.registeredTraits.concat(type);
    this.cmdRegistar.registerCommandForTrait(type);
    return { error: null };
  }

  unregisterTrait(_type: NoteTrait): RespV2<void> {
    throw new Error("Method not implemented.");
  }

  getTypesWithRegisteredCallback(_callbackType: callbackType): NoteTrait[] {
    throw new Error("Method not implemented.");
  }

  getRegisteredCommandForTrait(type: NoteTrait): string | undefined {
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
