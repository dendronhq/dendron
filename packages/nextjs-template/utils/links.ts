import { NoteProps } from "@dendronhq/common-all";

export function getNoteUrl(opts : { 
  note: NoteProps,
  noteIndex: NoteProps
}) {
  const { note, noteIndex } = opts;
  return note.id === noteIndex.id ? "/": `/notes/${note.id}`
}