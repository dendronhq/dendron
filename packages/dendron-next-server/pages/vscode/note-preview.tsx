import * as React from "react";
import {
  createLogger,
  engineHooks,
  engineSlice,
  postVSCodeMessage,
} from "@dendronhq/common-frontend";
import { DMessageSource, NoteViewMessageType } from "@dendronhq/common-all";
import { getWsAndPort } from "../../lib/env";
import { DendronProps } from "../../lib/types";

const logger = createLogger("notePreview");

function Note({ engine, ide }: DendronProps) {
  logger.info({
    state: "enter",
  });

  const dispatch = engineHooks.useEngineAppDispatch();

  const { noteActive } = ide;
  const noteId = noteActive?.id;
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
        postVSCodeMessage({
          type: NoteViewMessageType.onClick,
          data: {
            id: noteId,
          },
          source: DMessageSource.webClient,
        });
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
    return <>Loading..(no `noteId`)</>;
  }
  if (!noteContent) {
    return <>Loading..(no `noteContent`)</>;
  }
  return (
    <div dangerouslySetInnerHTML={{ __html: engine.notesRendered[noteId]! }} />
  );
}

export default Note;
