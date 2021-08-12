import { FuseEngine, NoteProps, NotePropsDict } from "@dendronhq/common-all";
import _ from "lodash";
import { useRouter } from "next/router";
import React from "react";
import { getNoteRouterQuery } from "./etc";
import { NoteData } from "./types";

export type DendronRouterProps = ReturnType<typeof useDendronRouter>;
export type DendronLookupProps = ReturnType<typeof useDendronLookup>

export function useDendronRouter() {
  const router = useRouter();
  const query = getNoteRouterQuery(router);
  const changeActiveNote = (id: string, opts: {noteIndex: NoteProps}) => {
    if (id === opts.noteIndex.id) {
      return router.push(`/`);
    }
    return router.push(`/notes/${id}`);
  };
  const getActiveNote = ({notes}: {notes: NotePropsDict}): NoteProps|undefined => {
    const maybeIdByQuery = query?.id;
    return !_.isUndefined(maybeIdByQuery) ? notes[maybeIdByQuery] : undefined;
  }
  return {
    router,
    query,
    changeActiveNote,
    getActiveNote
  };
}

/**
 * Get instance of fuse js
 * @param setNoteIndex 
 */
export function useDendronLookup() {
	const [noteIndex, setNoteIndex] = React.useState<FuseEngine|undefined>(undefined);
  React.useEffect(() => {
    fetch("/data/notes.json").then(async (resp) => {
      const { notes } = (await resp.json()) as NoteData;
      const noteIndex = new FuseEngine({ mode: "fuzzy" });
      noteIndex.updateNotesIndex(notes);
      setNoteIndex(noteIndex);
    });
  }, []);
	return noteIndex
}
