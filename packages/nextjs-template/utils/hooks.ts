import {
  ConfigUtils,
  FuseEngine,
  IntermediateDendronConfig,
  NoteProps,
  NotePropsByIdDict,
} from "@dendronhq/common-all";
import { verifyEngineSliceState } from "@dendronhq/common-frontend";
import { Grid } from "antd";
import _ from "lodash";
import { useRouter } from "next/router";
import React from "react";
import { useEngineAppSelector } from "../features/engine/hooks";
import { getNoteRouterQuery } from "./etc";
import { fetchNoteBody } from "./fetchers";

export type DendronRouterProps = ReturnType<typeof useDendronRouter>;

export function useDendronRouter() {
  const router = useRouter();
  const query = getNoteRouterQuery(router);
  const getNoteUrl = (
    id: string,
    opts: { noteIndex: NoteProps | undefined }
  ) => {
    if (id === opts?.noteIndex?.id) {
      return `/`;
    }
    return `/notes/${id}`;
  };
  const changeActiveNote = (id: string, opts: { noteIndex: NoteProps }) => {
    router.push(getNoteUrl(id, opts));
  };

  const getActiveNote = ({
    notes,
  }: {
    notes: NotePropsByIdDict;
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
    getNoteUrl,
    getActiveNote,
    getActiveNoteId,
  };
}

/**
 * Get instance of fuse js
 * @param setNoteIndex
 */
export function useDendronLookup(notes?: NotePropsByIdDict) {
  const engine = useEngineAppSelector((state) => state.engine);
  const config = engine.config as IntermediateDendronConfig;
  const fuzzThreshold = ConfigUtils.getLookup(config).note.fuzzThreshold;

  const [noteIndex, setNoteIndex] = React.useState<FuseEngine | undefined>(
    undefined
  );
  React.useEffect(() => {
    if (notes) {
      const noteIndex = new FuseEngine({ mode: "fuzzy", fuzzThreshold });
      noteIndex.notesIndex.setCollection(
        _.map(notes, ({ fname, title, id, vault, updated, stub }, _key) => ({
          fname,
          id,
          title,
          vault,
          updated,
          stub,
        }))
      );

      setNoteIndex(noteIndex);
    }
  }, [notes]);
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
  }, [id, engine.noteIndex, engine]);
  return { noteActive };
}

async function fetchNoteBodyWithId(id: string) {
  return { id, body: await fetchNoteBody(id) };
}

/** Fetch note bodies (markdown), caching them once fetched.
 *
 * @returns A map of note bodies, and a callback to request more notes.
 *
 * Once the requested note bodies are fetched, the hook should cause an automatic
 * re-render.
 */
export function useNoteBodies() {
  // Using this as a set, because React doesn't seem to like actual sets. Tracks all notes requested so far.
  const [requestedIds, setRequestedIds] = React.useState<
    Readonly<{ [noteId: string]: true }>
  >({});
  // All note bodies fetched so far.
  const [noteBodies, setNoteBodies] = React.useState<
    Readonly<{ [noteId: string]: string }>
  >({});

  React.useEffect(() => {
    // Fetch all requested notes we don't already have
    const fetches: Promise<{ id: string; body: string }>[] = [];
    Object.keys(requestedIds).forEach((id) => {
      if (noteBodies[id] !== undefined) return;
      fetches.push(fetchNoteBodyWithId(id));
    });
    // Avoid resetting noteBodies if we are not fetching anything
    if (fetches.length === 0) return;

    // Once all fetches are done, update the note bodies
    Promise.all(fetches).then((notes) => {
      const newNoteBodies = { ...noteBodies };
      notes.forEach(({ id, body }) => {
        newNoteBodies[id] = body;
      });
      // force a re-render
      setNoteBodies(newNoteBodies);
    });
  }, [noteBodies, requestedIds]);

  // The callback to request more notes to be feched.
  function requestNotes(ids: string[]) {
    const newRequestedIds = { ...requestedIds };
    let changed = false;
    for (const id of ids) {
      if (requestedIds[id] === true) continue;
      newRequestedIds[id] = true;
      changed = true;
    }
    // re-run the effect to fetch these notes, if any new notes have been requested
    if (changed) setRequestedIds(newRequestedIds);
  }

  return { noteBodies, requestNotes };
}

export function useIsMobile() {
  const screens = Grid.useBreakpoint();
  const isMobile = !_.some([screens.md, screens.lg, screens.xl, screens.xxl]);
  return { isMobile, screens };
}
