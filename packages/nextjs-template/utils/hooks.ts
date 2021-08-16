import {
  FuseEngine,
  getStage,
  NoteProps,
  NotePropsDict,
} from "@dendronhq/common-all";
import _ from "lodash";
import { useRouter } from "next/router";
import React from "react";
import { verifyEngineSliceState } from "@dendronhq/common-frontend";
import { useEngineAppSelector } from "../features/engine/hooks";
import { getNoteRouterQuery } from "./etc";
import { NoteData } from "./types";

export type DendronRouterProps = ReturnType<typeof useDendronRouter>;
export type DendronLookupProps = ReturnType<typeof useDendronLookup>;

export function useDendronRouter() {
  const router = useRouter();
  const query = getNoteRouterQuery(router);
  const changeActiveNote = (id: string, opts: { noteIndex: NoteProps }) => {
    if (id === opts.noteIndex.id) {
      return router.push(`/`);
    }
    router.push(`/notes/${id}`);
  };

  const getActiveNote = ({
    notes,
  }: {
    notes: NotePropsDict;
  }): NoteProps | undefined => {
    const maybeIdByQuery = query?.id;
    return !_.isUndefined(maybeIdByQuery) ? notes[maybeIdByQuery] : undefined;
  };
  const getActiveNoteId = () => {
    // assume home page
    if (!router.asPath.startsWith("/notes")) {
      return "root";
    } else {
      return query.id;
    }
  };

  return {
    router,
    query,
    changeActiveNote,
    getActiveNote,
    getActiveNoteId,
  };
}

/**
 * Get instance of fuse js
 * @param setNoteIndex
 */
export function useDendronLookup() {
  const [noteIndex, setNoteIndex] =
    React.useState<FuseEngine | undefined>(undefined);
  React.useEffect(() => {
    fetch("/data/notes.json").then(async (resp) => {
      const { notes } = (await resp.json()) as NoteData;
      const noteIndex = new FuseEngine({ mode: "fuzzy" });
      noteIndex.updateNotesIndex(notes);
      setNoteIndex(noteIndex);
    });
  }, []);
  return noteIndex;
}

type DendronNotesHookProps = {
  noteActive: NoteProps | undefined;
};

/**
 * Get the currently active note
 * @param id
 * @returns
 */
export function useNoteActive(id: string | undefined): DendronNotesHookProps {
  const [noteActive, setNoteActive] = React.useState<NoteProps | undefined>();
  const engine = useEngineAppSelector((state) => state.engine);
  React.useEffect(() => {
    if (!verifyEngineSliceState(engine) || !id) {
      return;
    }
    if (id === "root") {
      return setNoteActive(engine.noteIndex);
    }
    // TODO: in the future, we want to fetch this  dynamically
    const note = engine.notes[id];
    setNoteActive(note);
  }, [id, engine.noteIndex]);
  return { noteActive };
}
