import { IntermediateDendronConfig, NoteProps } from "@dendronhq/common-all";
import {
  createLogger,
  DendronNote,
  LoadingStatus,
} from "@dendronhq/common-frontend";
import { Col, Row } from "antd";
import _ from "lodash";
import React from "react";
import { DendronComponent } from "../types";

const useDendronNoteBody = () => {
	return [];
};

const DendronNotePage: DendronComponent = () => {
  const logger = createLogger("DendronNotePage");
	const [noteBody, setBody] = useDendronNoteBody();

	return <div>Dendron Note Page</div>;
}

export default DendronNotePage;