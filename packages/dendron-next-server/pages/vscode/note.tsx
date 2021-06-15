import * as React from "react";
import {
  createLogger,
  engineHooks,
  engineSlice,
} from "@dendronhq/common-frontend";
import { getWsAndPort } from "../../lib/env";
import { DendronProps } from "../../lib/types";

const logger = createLogger("noteView");

function Note({ engine, ide }: DendronProps) {
  logger.info({
    state: "enter",
  });

  const dispatch = engineHooks.useEngineAppDispatch();

  const noteId = ide.noteActive?.id;

  React.useEffect(() => {
    if (!noteId) {
      logger.info({ msg: "no noteId" });
      return;
    }
    const maybeNoteContent = engine.notesRendered[noteId];
    if (!maybeNoteContent) {
      dispatch(engineSlice.renderNote({ ...getWsAndPort(), id: noteId }));
    }
  }, [ide.noteActive, engine.notesRendered]);

  if (!noteId) {
    return <>Loading..</>;
  }
  if (!engine.notesRendered[noteId]) {
    return <>Loading..</>;
  }
  return (
    <div dangerouslySetInnerHTML={{ __html: engine.notesRendered[noteId]! }} />
  );
}

export default Note;
