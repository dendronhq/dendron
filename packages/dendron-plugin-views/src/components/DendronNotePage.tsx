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
	const ctx = "DendronNotePage";
  const logger = createLogger("DendronNotePage");
	const noteProps = props.ide.noteActive;
	logger.info({ctx, msg: "enter", noteProps: (noteProps ? noteProps.id : "no notes found")})
	const [noteRenderedBody] = useRenderedNoteBody({...props, noteProps})
	logger.info({ctx, noteProps: (_.isUndefined(noteProps) ?  "no active note": noteProps.id)})

	if (!noteRenderedBody) {
		return null;
	}

	return <DendronNote noteContent={noteRenderedBody}/>
}

export default DendronNotePage;