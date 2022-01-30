import { Disposable, Event, NoteChangeEntry } from "@dendronhq/common-all";

/**
 * Interface for events signaling changes that have been made to engine state
 */
export interface EngineEvents extends Disposable {
  /**
   * Event that fires upon the changing of note state in the engine.
   */
  get onEngineNoteStateChanged(): Event<NoteChangeEntry[]>;
}
