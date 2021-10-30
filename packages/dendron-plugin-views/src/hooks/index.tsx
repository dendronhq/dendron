import { getStage, NoteProps } from "@dendronhq/common-all";
import { engineHooks, engineSlice } from "@dendronhq/common-frontend";
import React from "react";
import { DendronProps, WorkspaceProps } from "../types";

type DendronPropsWithNoteId = DendronProps & { noteId: string };

export const useWorkspaceProps = (): [WorkspaceProps] => {
  const stage = getStage();
  if (stage === "dev") {
    return [
      {
        port: 3005,
        // TODO: pass in from env
        ws: "/Users/kevinlin/code/dendron/test-workspace",
        browser: true,
        theme: "light",
      },
    ];
  }
  const elem = window.document.getElementById("root")!;
  const port = parseInt(elem.getAttribute("data-port")!, 10);
  const ws = elem.getAttribute("data-ws")!;
  return [
    {
      port,
      ws,
      browser: false,
      // TODO: get
      theme: "light",
    },
  ];
  throw Error("not implemented");
};

/**
 * Body of current note
 * @param param0
 * @returns
 */
export const useRenderedNoteBody = ({
  engine,
  noteProps,
  workspace,
}: DendronProps & { noteProps?: NoteProps }) => {
  const { id: noteId, contentHash } = noteProps || {id: undefined, contentHash: undefined};
  const noteContent = engine.notesRendered[noteId || ""];
  const renderedNoteContentHash = React.useRef<string>();
  const dispatch = engineHooks.useEngineAppDispatch();

  React.useEffect(() => {
		if (!noteId) {
			return;
		}
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
export const useNoteProps = ({
  engine,
  noteId,
}: DendronProps & { noteId: string }) => {
  const maybeNote = engine.notes[noteId];
  if (!maybeNote) {
    throw Error(`note with id ${noteId} not found`);
  }
  return [maybeNote];
};

/**
 * Get current note id
 */
export const useNoteId = () => {
  // todo: get from env
  return ["9eae08fb-5e3f-4a7e-a989-3f206825d490"];
  throw Error("NOT IMPLEMENTED");
};

const useDendronNote = (props: DendronPropsWithNoteId) => {
  const [noteProps] = useNoteProps(props);
  const [noteRenderedBody] = useRenderedNoteBody({ ...props, noteProps });
  return [{ noteProps, noteRenderedBody }];
};
