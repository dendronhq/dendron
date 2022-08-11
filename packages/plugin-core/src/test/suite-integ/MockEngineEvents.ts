import {
  EngineEventEmitter,
  Event,
  NoteChangeEntry,
} from "@dendronhq/common-all";
import { EventEmitter } from "vscode";

/**
 * Convenience class for testing classes that rely on EngineEvents signaling
 */
export class MockEngineEvents implements EngineEventEmitter {
  _onNoteStateChangedEmitter = new EventEmitter<NoteChangeEntry[]>();

  get onEngineNoteStateChanged(): Event<NoteChangeEntry[]> {
    return this._onNoteStateChangedEmitter.event;
  }

  /**
   * Use this method to mock an engine change event to trigger a response from
   * the component you're testing.
   * @param entries
   */
  public testFireOnNoteChanged(entries: NoteChangeEntry[]) {
    this._onNoteStateChangedEmitter.fire(entries);
  }

  dispose() {
    this._onNoteStateChangedEmitter.dispose();
  }
}
