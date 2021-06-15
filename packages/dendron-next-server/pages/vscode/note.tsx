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

  const { noteActive } = ide;
  const noteId = noteActive?.id || "05774b2e-ebf7-4bbc-8171-ad191ba0ae0a";
  const noteContent = noteId && engine.notesRendered[noteId];

  React.useEffect(() => {
    if (!noteId) {
      logger.info({ msg: "no noteId" });
      return;
    }
    if (!noteContent) {
      dispatch(engineSlice.renderNote({ ...getWsAndPort(), id: noteId }));
    }
  }, [noteId, noteContent]);

  const onClickHandler = React.useCallback(
    (event: Event) => {
      if ((event.target as Element).tagName === "A") {
        logger.info({
          msg: "click#a",
          event: (event.target as Element).tagName,
        });
        event.preventDefault();
        event.stopPropagation();
        // postVSCodeMessage(...);
      }
    },
    [noteId]
  );

  React.useEffect(() => {
    window.addEventListener("click", onClickHandler);

    return () => {
      window.removeEventListener("click", onClickHandler);
    };
  }, [onClickHandler]);

  if (!noteId) {
    return <>Loading..</>;
  }
  if (!noteContent) {
    return <>Loading..</>;
  }
  return (
    <div dangerouslySetInnerHTML={{ __html: engine.notesRendered[noteId]! }} />
  );
}

export default Note;
