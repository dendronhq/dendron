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
  const { id: noteId, updated: noteTimestamp } = noteActive || {};
  const noteContent = engine.notesRendered[noteId || ""];

  // remember note timestamp from last "render to markdown"
  const noteTimestampRef = React.useRef<number>();

  React.useEffect(() => {
    if (!noteId) {
      logger.info({ msg: "no noteId" });
      return;
    }
    // if no "render to markdown" has happended or the note body changed
    if (!noteContent || noteTimestamp !== noteTimestampRef.current) {
      noteTimestampRef.current = noteTimestamp;
      dispatch(engineSlice.renderNote({ ...getWsAndPort(), id: noteId }));
    }
  }, [noteId, noteTimestamp]);

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
