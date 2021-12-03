import { IntermediateDendronConfig, NoteProps } from "@dendronhq/common-all";
import {
  createLogger,
  DendronNote,
  LoadingStatus,
} from "@dendronhq/common-frontend";
import { Col, Row } from "antd";
import _ from "lodash";
import React from "react";
import { DendronCollectionItem } from "../components/DendronCollection";
import DendronCustomHead from "../components/DendronCustomHead";
import DendronSEO from "../components/DendronSEO";
import DendronSpinner from "../components/DendronSpinner";
import { DendronTOC } from "../components/DendronTOC";
import { useCombinedDispatch, useCombinedSelector } from "../features";
import { browserEngineSlice } from "../features/engine";
import { DENDRON_STYLE_CONSTANTS } from "../styles/constants";
import { useDendronRouter, useIsMobile } from "../utils/hooks";

const { HEADER } = DENDRON_STYLE_CONSTANTS;

export type DendronNotePageProps = {
  // `InferGetStaticPropsType` doesn't get right types for some reason, hence the manual override here
  customHeadContent: string | null;
  noteIndex: NoteProps;
  note: NoteProps;
  body: string;
  collectionChildren: NoteProps[] | null;
  config: IntermediateDendronConfig;
};

export default function Note({
  note,
  body,
  collectionChildren,
  noteIndex,
  customHeadContent,
  config,
}: DendronNotePageProps) {
  const logger = createLogger("Note");
  const { getActiveNoteId } = useDendronRouter();
  const [bodyFromState, setBody] = React.useState<string | undefined>(
    undefined
  );
  let id = getActiveNoteId();
  if (id === "root") {
    id = noteIndex.id;
  }

  // --- Hooks
  const dispatch = useCombinedDispatch();
  const engine = useCombinedSelector((state) => state.engine);
  logger.info({ ctx: "enter", id });
  const { isMobile } = useIsMobile();

  // setup body
  React.useEffect(() => {
    logger.info({ ctx: "updateNoteBody:enter", id });
    if (_.isUndefined(id)) {
      logger.info({ ctx: "updateNoteBody:exit", id, state: "id undefined" });
      return;
    }
    // loaded page statically
    if (id === note.id) {
      dispatch(
        browserEngineSlice.actions.setLoadingStatus(LoadingStatus.FULFILLED)
      );
      logger.info({ ctx: "updateNoteBody:exit", id, state: "id = note.id" });
      return;
    }
    logger.info({ ctx: "updateNoteBody:fetch:pre", id });
    // otherwise, dynamically fetch page
    fetch(`/data/notes/${id}.html`).then(async (resp) => {
      logger.info({ ctx: "updateNoteBody:fetch:post", id });
      const contents = await resp.text();
      setBody(contents);
      dispatch(
        browserEngineSlice.actions.setLoadingStatus(LoadingStatus.FULFILLED)
      );
    });
  }, [id]);

  const noteBody = id === note.id ? body : bodyFromState;

  if (_.isUndefined(noteBody)) {
    return <DendronSpinner />;
  }

  const maybeCollection =
    note.custom?.has_collection && !_.isNull(collectionChildren)
      ? collectionChildren.map((child: NoteProps) =>
          DendronCollectionItem({ note: child, noteIndex })
        )
      : null;

  return (
    <>
      <DendronSEO note={note} config={config} />
      {customHeadContent && <DendronCustomHead content={customHeadContent} />}
      <Row>
        <Col span={24}>
          <Row gutter={20}>
            <Col xs={24} md={20}>
              <DendronNote noteContent={noteBody} config={config} />
              {maybeCollection}
            </Col>
            <Col xs={0} md={4}>
              <DendronTOC note={note} offsetTop={HEADER.HEIGHT} />
            </Col>
          </Row>
        </Col>
      </Row>
    </>
  );
}
