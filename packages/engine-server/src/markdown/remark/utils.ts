import { DendronError, NotePropsV2 } from "@dendronhq/common-all";
import _ from "lodash";
import { Processor } from "unified";

export function addError(proc: Processor, err: DendronError) {
  const errors = proc.data("errors") as DendronError[];
  errors.push(err);
  proc().data("errors", errors);
}

export function getNoteOrError(
  notes: NotePropsV2[],
  hint: any
): { error: DendronError | undefined; note: undefined | NotePropsV2 } {
  let error: DendronError | undefined;
  let note: NotePropsV2 | undefined;
  if (_.isUndefined(notes)) {
    error = new DendronError({ msg: `no note found. ${hint}` });
    return { error, note };
  }
  if (notes.length > 1) {
    error = new DendronError({ msg: `multiple notes found for link: ${hint}` });
    return { error, note };
  }
  if (notes.length < 1) {
    error = new DendronError({
      msg: `no notes found for link: ${JSON.stringify(hint)}`,
    });
    return { error, note };
  }
  note = notes[0];
  return { error, note };
}
