import {
  DMessageSource,
  FOOTNOTE_DEF_CLASS,
  FOOTNOTE_REF_CLASS,
  NoteViewMessageEnum,
} from "@dendronhq/common-all";
import {
  createLogger,
  DendronNote,
  engineHooks,
} from "@dendronhq/common-frontend";
import _ from "lodash";
import mermaid from "mermaid";
import { Button } from "antd";
import LockFilled from "@ant-design/icons/lib/icons/LockFilled";
import UnlockOutlined from "@ant-design/icons/lib/icons/UnlockOutlined";
import React from "react";
import {
  useCurrentTheme,
  useMermaid,
  useRenderedNoteBody,
  useWorkspaceProps,
} from "../hooks";
import { DendronComponent } from "../types";
import { postVSCodeMessage } from "../utils/vscode";
import type { SyntheticEvent } from "react";

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

const DendronNotePreview: DendronComponent = (props) => {
  const ctx = "DendronNotePreview";
  const logger = createLogger("DendronNotePreview");
  const noteProps = props.ide.noteActive;
  const config = props.engine.config;
  const [workspace] = useWorkspaceProps();
  const { useConfig } = engineHooks;
  useConfig({ opts: workspace });

  logger.info({
    ctx,
    msg: "enter",
    noteProps: noteProps ? noteProps.id : "no notes found",
    config,
  });

  const [noteRenderedBody] = useRenderedNoteBody({ ...props, noteProps });
  logger.info({
    ctx,
    noteProps: _.isUndefined(noteProps) ? "no active note" : noteProps.id,
  });

  useClickHandler(noteProps?.id);
  const { currentTheme: themeType } = useCurrentTheme();
  useMermaid({ config, themeType, mermaid, noteRenderedBody });

  if (props.engine.error) {
    return (
      <div>
        <h1>Error</h1>
        <div>{props.engine.error}</div>
      </div>
    );
  }
  if (!noteRenderedBody || !config) {
    return <div>Loading...</div>;
  }

  const isLocked = props.ide.isLocked;

  const handleLock = (event: SyntheticEvent<HTMLElement>) => {
    if (!(event.currentTarget instanceof HTMLElement)) {
      return;
    }
    postVSCodeMessage({
      type: isLocked
        ? NoteViewMessageEnum.onUnlock
        : NoteViewMessageEnum.onLock,
      data: {
        id: props.ide.noteActive?.id,
      },
      source: DMessageSource.webClient,
    });
  };

  return (
    <>
      <DendronNote noteContent={noteRenderedBody} config={config} />
      <Button
        shape="circle"
        icon={isLocked ? <LockFilled /> : <UnlockOutlined />}
        onClick={handleLock}
        style={{
          position: "fixed",
          top: 33,
          right: 33,
          opacity: isLocked ? 1 : 0.3,
        }}
      />
    </>
  );
};

export default DendronNotePreview;
