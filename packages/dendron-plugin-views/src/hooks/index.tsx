import {
  getStage,
  IntermediateDendronConfig,
  NoteProps,
  ThemeType,
} from "@dendronhq/common-all";
import {
  createLogger,
  engineHooks,
  engineSlice,
} from "@dendronhq/common-frontend";
import { Mermaid } from "mermaid";
import React from "react";
import { DendronProps, WorkspaceProps } from "../types";

type DendronPropsWithNoteId = DendronProps & { noteId: string };

export const useWorkspaceProps = (): [WorkspaceProps] => {
  const stage = getStage();
  const elem = window.document.getElementById("root")!;
  const port = parseInt(elem.getAttribute("data-port")!, 10);
  const ws = elem.getAttribute("data-ws")!;
  const isBrowser = elem.getAttribute("data-browser")! === "true";
  const theme = elem.getAttribute("data-browser")!;
  return [
    {
      port,
      ws,
      browser: isBrowser,
      theme,
    },
  ];
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
  const { id: noteId, contentHash } = noteProps || {
    id: undefined,
    contentHash: undefined,
  };
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


function getMermaid(window: Window): Mermaid | undefined {
  // NOTE: a mermaid h3 header will result in window.mermaid being defined
  // @ts-ignore
  if (window.mermaid && window.mermaid.initialize) {
    // @ts-ignore
    return window.mermaid as Mermaid;
  }
}

/**
 *
 * @param fn
 * @param opts.initiialized - check if mermaid has already been initialized
 */
function mermaidReady(fn: () => any, opts?: { checkInit?: boolean }) {
  // see if DOM is already available
  if (
    getMermaid(window) &&
    // @ts-ignore
    (opts?.checkInit ? window.MERMAID_INITIALIZED : true)
  ) {
    // call on next available tick
    setTimeout(fn, 1);
  } else {
    setTimeout(() => {
      mermaidReady(fn, opts);
    }, 100);
  }
}

/**
 * Initialize mermaid if it is enabled
 */
export const useMermaid = ({
  config,
  themeType,
  mermaid,
  noteRenderedBody
}: {
  config?: IntermediateDendronConfig;
  themeType: ThemeType;
  mermaid: Mermaid;
  noteRenderedBody?: string
}) => {
  React.useEffect(() => {
    if (config?.mermaid) {
      const logger = createLogger("useMermaid");
      mermaid.initialize({
        startOnLoad: true,
        theme: themeType === ThemeType.LIGHT ? "forest" : "dark",
      });
      // use for debugging
      // @ts-ignore
      window._mermaid = mermaid;
      // @ts-ignore
      mermaid.init();
      logger.info("init mermaid");
    }
  }, [config, noteRenderedBody]);
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
