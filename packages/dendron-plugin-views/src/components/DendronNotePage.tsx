import {
  DMessageSource, FOOTNOTE_DEF_CLASS, FOOTNOTE_REF_CLASS, NoteViewMessageEnum, ThemeType
} from "@dendronhq/common-all";
import {
  createLogger,
  DendronNote
} from "@dendronhq/common-frontend";
import _ from "lodash";
import React from "react";
import { useMermaid, useRenderedNoteBody } from "../hooks";
import { DendronComponent } from "../types";
import { postVSCodeMessage } from "../utils/vscode";
import mermaid from "mermaid";


function isHTMLAnchorElement(element: Element): element is HTMLAnchorElement {
  return element.nodeName === "A";
}

/** Set of anchor (<a ...>) classes for which the default action should be performed.
 *
 * Use this for links that are handled within the frontend, like the links for the footnotes that just move the preview.
 * This will stop the click from being sent to VSCode, and it will allow the default click action to proceed.
 */
const DEFAULT_ACTION_ANCHOR_CLASSES: Set<string> = new Set([
  FOOTNOTE_REF_CLASS,
  FOOTNOTE_DEF_CLASS,
]);

const useClickHandler = (noteId?: string) => {
  const onClickHandler = React.useCallback(
    (event: Event) => {
      const target = event.target as Element;
      // Propogate clicks to wikilinks, but not clicks to elements like footnotes
      if (isHTMLAnchorElement(target)) {
        if (
          _.some(target.classList, (class_) =>
            DEFAULT_ACTION_ANCHOR_CLASSES.has(class_)
          )
        ) {
          // logger.info({
          //   ctx: `onClickHandler#${target.nodeName}`,
          //   event,
          //   target,
          //   msg: "skipped click on default action anchor",
          // });
          return;
        }
        // logger.info({
        //   ctx: `onClickHandler#${target.nodeName}`,
        //   event,
        //   target,
        //   msg: "propagating click to VSCode",
        // });
        event.preventDefault();
        event.stopPropagation();
        if (noteId) {
          postVSCodeMessage({
            type: NoteViewMessageEnum.onClick,
            data: {
              href: target.href,
              id: noteId,
            },
            source: DMessageSource.webClient,
          });
        }
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
};

const DendronNotePage: DendronComponent = (props) => {
  const ctx = "DendronNotePage";
  const logger = createLogger("DendronNotePage");
  const noteProps = props.ide.noteActive;
  const config = props.engine.config;

  logger.info({
    ctx,
    msg: "enter",
    noteProps: noteProps ? noteProps.id : "no notes found",
  });

  const [noteRenderedBody] = useRenderedNoteBody({ ...props, noteProps });
  logger.info({
    ctx,
    noteProps: _.isUndefined(noteProps) ? "no active note" : noteProps.id,
  });

  useClickHandler(noteProps?.id);
  // TODO: dynamiclally set
  useMermaid({ config, themeType: ThemeType.LIGHT, mermaid, noteRenderedBody });

  if (!noteRenderedBody) {
    return null;
  }
  return <DendronNote noteContent={noteRenderedBody} />;
};

export default DendronNotePage;
