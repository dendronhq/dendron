import { ERROR_SEVERITY } from "../constants";
import { DendronError, DendronErrorProps, IDendronError } from "../error";
import { VaultUtils } from "../vault";
import { DVault } from "./DVault";
import { NoteProps } from "./foundation";

/** The error codes of errors that can occur during engine init. */
export enum EngineInitErrorType {
  DUPLICATE_NOTE_ID = "duplicate note id",
}

/** A duplicate note ID error.
 *
 * Note IDs must be unique, duplicate note IDs can cause issues in many parts of
 * Dendron. This error occurs when a duplicate note ID is detected during engine
 * init. It's non-fatal because most of Dendron will still function after this
 * error.
 */
export class DuplicateNoteError extends DendronError<EngineInitErrorType.DUPLICATE_NOTE_ID> {
  constructor(
    opts: Omit<
      DendronErrorProps<EngineInitErrorType.DUPLICATE_NOTE_ID>,
      "name" | "message" | "severity"
    > & {
      noteA: NoteProps;
      noteB: NoteProps;
    }
  ) {
    super({
      ...opts,
      severity: ERROR_SEVERITY.MINOR,
      message: `Notes ${opts.noteA.fname} in ${VaultUtils.getName(
        opts.noteA.vault
      )} and ${opts.noteB.fname} in ${VaultUtils.getName(
        opts.noteB.vault
      )} have duplicate IDs.`,
      code: EngineInitErrorType.DUPLICATE_NOTE_ID,
    });
    this.noteA = {
      fname: opts.noteA.fname,
      vault: opts.noteA.vault,
    };
    this.noteB = {
      fname: opts.noteB.fname,
      vault: opts.noteB.vault,
    };
  }

  public noteA: {
    fname: string;
    vault: DVault;
  };
  public noteB: {
    fname: string;
    vault: DVault;
  };

  static isDuplicateNoteError(
    error: IDendronError<any>
  ): error is DuplicateNoteError {
    return error.code === EngineInitErrorType.DUPLICATE_NOTE_ID;
  }
}
