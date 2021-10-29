import { NoteProps } from "@dendronhq/common-all";
import {
	engineHooks,
	engineSlice
} from "@dendronhq/common-frontend";
import React from "react";
import { DendronProps, WorkspaceProps } from "../types";

type DendronPropsWithNoteId = DendronProps & {noteId :string}

export const useWorkspaceProps = () => {
	return [{} as WorkspaceProps]
}

/**
 * Body of current note
 * @param param0 
 * @returns 
 */
export const useRenderedNoteBody = ({engine, noteProps, workspace}: DendronProps & {noteProps: NoteProps}) => {
	const {id: noteId, contentHash} = noteProps;
  const noteContent = engine.notesRendered[noteId || ""];
  const renderedNoteContentHash = React.useRef<string>();
  const dispatch = engineHooks.useEngineAppDispatch();
  React.useEffect(() => {
    // if no "render to markdown" has happended or the note body changed
    if (!noteContent || contentHash !== renderedNoteContentHash.current) {
      renderedNoteContentHash.current = contentHash;
      dispatch(engineSlice.renderNote({ ...workspace, id: noteId }));
    }
  }, [noteId, contentHash]);
	return [noteContent];
};

/**
 * Metadata about current note
 * @param param0 
 * @returns 
 */
export const useNoteProps = ({engine, noteId}: DendronProps & {noteId: string}) => {
	const maybeNote = engine.notes[noteId];
	if (!maybeNote) {
		throw Error(`note with id ${noteId} not found`)
	}
	return [maybeNote];
};

/**
 * Get current note id
 */
export const useNoteId = () => {
	return ["foo"];
}

const useDendronNote = (props: DendronPropsWithNoteId) => {
	const [noteProps] = useNoteProps(props)
	const [noteRenderedBody] = useRenderedNoteBody({...props, noteProps})
	return [{noteProps, noteRenderedBody}]
}