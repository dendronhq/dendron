import {
  DendronError,
  ERROR_SEVERITY,
  NoteTrait,
  ResponseUtil,
  RespV2,
} from "@dendronhq/common-all";
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

export class NoteTraitManager implements NoteTraitService {
  private cmdRegistar: CommandRegistrar;
  registeredTraits: NoteTrait[] = [];

  constructor(registrar: CommandRegistrar) {
    this.cmdRegistar = registrar;
  }

  registerTrait(trait: NoteTrait): RespV2<void> {
    if (
      this.registeredTraits.find((registered) => registered.id === trait.id) !==
      undefined
    ) {
      return ResponseUtil.createUnhappyResponse({
        error: new DendronError({
          message: `Type with ID ${trait.id} has already been registered`,
          severity: ERROR_SEVERITY.MINOR,
        }),
      });
    }

    this.registeredTraits = this.registeredTraits.concat(trait);
    this.cmdRegistar.registerCommandForTrait(trait);
    return { error: null };
  }

  unregisterTrait(_trait: NoteTrait): RespV2<void> {
    throw new Error("Method not implemented.");
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
}

/**
 * Not used yet
 */
export enum callbackType {
  onDescendantLifecycleEvent,
  onSiblingLifecycleEvent,
}
