import { Event, NoteChangeEntry } from "@dendronhq/common-all";
import { EngineEvents } from "@dendronhq/engine-server";
import { EventEmitter } from "vscode";

/**
 * Convenience class for testing classes that rely on EngineEvents signaling
 */
export class MockEngineEvents implements EngineEvents {
  _onNoteChangedEmitter = new EventEmitter<NoteChangeEntry[]>();

  get onNoteChanged(): Event<NoteChangeEntry[]> {
    return this._onNoteChangedEmitter.event;
  }

  /**
   * Use this method to mock an engine change event to trigger a response from
   * the component you're testing.
   * @param entries
   */
  public testFireOnNoteChanged(entries: NoteChangeEntry[]) {
    this._onNoteChangedEmitter.fire(entries);
  }

  dispose() {
    this._onNoteChangedEmitter.dispose();
  }
}
