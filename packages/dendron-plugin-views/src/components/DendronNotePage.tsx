import { IntermediateDendronConfig, NoteProps } from "@dendronhq/common-all";
import {
  createLogger,
  DendronNote,
  engineHooks,
  engineSlice,
  LoadingStatus,
} from "@dendronhq/common-frontend";
import { Col, Row } from "antd";
import _ from "lodash";
import React from "react";
import { useNoteId, useNoteProps, useRenderedNoteBody } from "../hooks";
import { DendronComponent, DendronProps, WorkspaceProps } from "../types";



const DendronNotePage: DendronComponent = (props) => {
  const logger = createLogger("DendronNotePage");
	const [noteId] = useNoteId();
	const [noteProps] = useNoteProps({...props, noteId})
	const [noteRenderedBody] = useRenderedNoteBody({...props, noteProps})

	if (!noteRenderedBody) {
		return null;
	}

	return <DendronNote noteContent={noteRenderedBody}/>
}

export default DendronNotePage;