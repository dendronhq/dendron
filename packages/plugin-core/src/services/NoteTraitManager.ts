import {
  DendronError,
  ERROR_SEVERITY,
  NoteTrait,
  ResponseUtil,
  RespV2,
} from "@dendronhq/common-all";
import { CommandRegistrar } from "./CommandRegistrar";
import { NoteTraitService } from "./NoteTraitService";

export class NoteTraitManager implements NoteTraitService {
  private cmdRegistar: CommandRegistrar;

  constructor(registrar: CommandRegistrar) {
    this.cmdRegistar = registrar;
    this.registeredTraits = new Map<string, NoteTrait>();
  }

  registeredTraits: Map<string, NoteTrait>;

  registerTrait(trait: NoteTrait): RespV2<void> {
    if (this.registeredTraits.has(trait.id)) {
      return ResponseUtil.createUnhappyResponse({
        error: new DendronError({
          message: `Type with ID ${trait.id} has already been registered`,
          severity: ERROR_SEVERITY.MINOR,
        }),
      });
    }

    this.registeredTraits.set(trait.id, trait);

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
enum callbackType {
  onDescendantLifecycleEvent,
  onSiblingLifecycleEvent,
}
