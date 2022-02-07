import { Disposable, Event, NoteChangeEntry } from "@dendronhq/common-all";

/**
 * Interface providing events signaling changes that have been made to engine
 * state
 */
export interface EngineEventEmitter extends Disposable {
  /**
   * Event that fires upon the changing of note state in the engine.
   */
  get onEngineNoteStateChanged(): Event<NoteChangeEntry[]>;
}
