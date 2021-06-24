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

function isHTMLAnchorElement(element: Element): element is HTMLAnchorElement {
  return element.nodeName === "A";
}

function Note({ engine, ide }: DendronProps) {
  logger.info({
    state: "enter",
  });

  const dispatch = engineHooks.useEngineAppDispatch();

  const { noteActive } = ide;
  const noteId = noteActive?.id || "apples";
  const noteTimestamp = noteActive?.updated;
  const noteContent = engine.notesRendered[noteId];
  const noteContentTimestamp = engine.notesRenderedTimestamp[noteId];

  React.useEffect(() => {
    if (!noteId) {
      logger.info({ msg: "no noteId" });
      return;
    }
    if (!noteContent || noteContentTimestamp !== noteTimestamp) {
      dispatch(engineSlice.renderNote({ ...getWsAndPort(), id: noteId }));
    }
  }, [noteId, noteContent, noteContentTimestamp, noteTimestamp]);

  const onClickHandler = React.useCallback(
    (event: Event) => {
      const target = event.target as Element;
      if (isHTMLAnchorElement(target)) {
        logger.info({
          ctx: `onClickHandler#${target.nodeName}`,
          event,
          target,
        });
        event.preventDefault();
        event.stopPropagation();
        postVSCodeMessage({
          type: NoteViewMessageType.onClick,
          data: {
            href: target.href,
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
  return <div dangerouslySetInnerHTML={{ __html: noteContent }} />;
}

export default Note;
