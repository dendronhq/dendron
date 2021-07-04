import { DMessageSource, NoteViewMessageType } from "@dendronhq/common-all";
import {
  createLogger,
  engineHooks,
  engineSlice,
  postVSCodeMessage,
} from "@dendronhq/common-frontend";
import { Col, Layout, Row } from "antd";
import * as React from "react";
import { useState } from "react";
import { getWsAndPort } from "../../lib/env";
import { DendronProps } from "../../lib/types";

const logger = createLogger("notePreview");

function isHTMLAnchorElement(element: Element): element is HTMLAnchorElement {
  return element.nodeName === "A";
}

type NotePreviewProps = DendronProps & {
  initNoteId?: string;
};

function AntLayout(props: React.PropsWithChildren<any>) {
  return (
    <Layout>
      <br />
      <br />
      <Layout>
        <Row gutter={16}>
          <Col className="gutter-row" span={2}></Col>
          <Col className="gutter-row" span={20}>
            <Layout.Content>{props.children}</Layout.Content>
          </Col>
          <Col className="gutter-row" span={2}></Col>
        </Row>
      </Layout>
    </Layout>
  );
}

function Note({ engine, ide, initNoteId }: NotePreviewProps) {
  logger.info({
    state: "enter",
  });
  const [isFirstRender, setFirstRender] = useState(true);

  const dispatch = engineHooks.useEngineAppDispatch();

  const { noteActive } = ide;
  let { id: noteId = "9eae08fb-5e3f-4a7e-a989-3f206825d490", contentHash } =
    noteActive || {};
  const noteContent = engine.notesRendered[noteId || ""];

  // remember note contentHash from last "render to markdown"
  const renderedNoteContentHash = React.useRef<string>();

  React.useEffect(() => {
    if (initNoteId && isFirstRender) {
      noteId = initNoteId;
      setFirstRender(false);
    }
    if (!noteId) {
      logger.info({ msg: "no noteId" });
      return;
    }
    // if no "render to markdown" has happended or the note body changed
    if (!noteContent || contentHash !== renderedNoteContentHash.current) {
      renderedNoteContentHash.current = contentHash;
      dispatch(engineSlice.renderNote({ ...getWsAndPort(), id: noteId }));
    }
  }, [noteId, contentHash]);

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
    return null;
  }
  if (!noteContent) {
    return null;
  }
  return (
    <AntLayout>
      <div dangerouslySetInnerHTML={{ __html: noteContent }} />
    </AntLayout>
  );
}

export default Note;
