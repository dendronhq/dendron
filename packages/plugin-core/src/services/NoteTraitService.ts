import { NoteTrait, RespV2 } from "@dendronhq/common-all";
import * as vscode from "vscode";

/**
 * Interface for a service that manages Note Traits
 * TODO: Figure out how to split functionality here such that some can move to engine-server while plugin-specific func stays in plugin-core
 * TODO: Expand functionality to cover more advanced typed functionality such as note lifecycle events
 */
export type NoteTraitService = vscode.Disposable & {
  /**
   * Contains list of registered Note Traits
   */
  readonly registeredTraits: Map<string, NoteTrait>;

  /**
   * Method for any intialization logic
   */
  initialize(): Promise<void>;

  /**
   * Register a New Note Trait
   * @param trait
   */
  registerTrait(trait: NoteTrait): RespV2<void>;

  /**
   * Unregister an Existing Note Trait
   * @param trait
   */
  unregisterTrait(trait: NoteTrait): RespV2<void>;

  /**
   * Returns the VS Code command that will create a note for the specified when
   * the command is run.
   * @param trait
   */
  getRegisteredCommandForTrait(trait: NoteTrait): string | undefined;
};
