/* eslint-disable global-require */
/* eslint-disable import/no-dynamic-require */
import {
  ConfigUtils,
  IntermediateDendronConfig,
  NoteProps,
} from "@dendronhq/common-all";
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
import { useCombinedDispatch } from "../features";
import { browserEngineSlice } from "../features/engine";
import { DENDRON_STYLE_CONSTANTS } from "../styles/constants";
import { useDendronRouter } from "../utils/hooks";
import { MermaidScript } from "./MermaidScript";
import { DendronNoteGiscusWidget } from "./DendronNoteGiscusWidget";

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
let BannerAlert: any | undefined;

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

  React.useEffect(() => {
    const BannerFile =
      ConfigUtils.getPublishing(config).siteBanner === "custom"
        ? "BannerAlert.tsx"
        : "NoOp";
    logger.info({ ctx: "loading banner", BannerFile });
    BannerAlert = require(`../custom/${BannerFile}`).default;
  }, []);

  // --- Hooks
  const dispatch = useCombinedDispatch();
  logger.info({ ctx: "enter", id });

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
      ? collectionChildren.map((child: NoteProps) => (
          <DendronCollectionItem
            key={child.id}
            note={child}
            noteIndex={noteIndex}
          />
        ))
      : null;

  return (
    <>
      <MermaidScript noteBody={noteBody} />
      <DendronSEO note={note} config={config} />
      {customHeadContent && <DendronCustomHead content={customHeadContent} />}
      <Row>
        <Col span={24}>
          <Row gutter={20}>
            <Col xs={24} md={18}>
              {BannerAlert && <BannerAlert />}
              <DendronNote noteContent={noteBody} />
              {maybeCollection}
              <DendronNoteGiscusWidget note={note} config={config} />
            </Col>
            <Col xs={0} md={6}>
              <DendronTOC note={note} offsetTop={HEADER.HEIGHT} />
            </Col>
          </Row>
        </Col>
      </Row>
    </>
  );
}
