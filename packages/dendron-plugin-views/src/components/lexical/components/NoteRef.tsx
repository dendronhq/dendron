import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import * as React from "react";
import { TreeView } from "./DendronLexicalTreeView";
import {
  createLogger,
  engineHooks,
  engineSlice,
} from "@dendronhq/common-frontend";
import { DendronProps } from "../../../types";
import { NoteProps } from "@dendronhq/common-all";
import { useWorkspaceProps } from "../../../hooks";
import { useEffect } from "react";
import { EngineState } from "@dendronhq/common-frontend/lib/features/engine/slice";

const { useEngineAppSelector } = engineHooks;

export default function NoteRef({
  fname,
  engine,
}: {
  fname: string;
  engine: EngineState;
}) {
  // const engine = useEngineAppSelector((state) => state.engine);
  const [workspace] = useWorkspaceProps();
  const dispatch = engineHooks.useEngineAppDispatch();

  console.log(`Trying to create note ref for fname ${fname}`);

  const foo = engine.noteFName[fname];

  let noteId: string | undefined = undefined;
  if (!foo || foo.length === 0) {
    console.log(`nothing found`);
  } else {
    noteId = engine.noteFName[fname][0];
  }

  const noteContent = noteId ? engine.notesRendered[noteId] : undefined;
  console.log(`Note Rendered count: ${engine.notesRendered.length}`);

  useEffect(() => {
    if (!noteId) {
      return;
    }
    const noteProps = engine.notes[noteId];

    const noteContent = noteId ? engine.notesRendered[noteId] : undefined;
    console.log(noteContent);

    dispatch(
      engineSlice.renderNote({ ...workspace, id: noteId, note: noteProps })
    );

    console.log(
      `Just sent a render dispatch for ${noteId} with noteProps ${noteProps}`
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [noteId, engine]);

  console.log("Finished NoteRef Render");

  let link = "http:\\www.google.com";

  const linkLine = `<a href=${link} class="portal-arrow">Go to text <span class="right-arrow">→</span></a>`;
  const top = `<div class="portal-container">
<div class="portal-head">
<div class="portal-backlink" >
<div class="portal-title">From <span class="portal-text-title">${fname}</span></div>
${linkLine}
</div>
</div>
<div id="portal-parent-anchor" class="portal-parent" markdown="1">
<div class="portal-parent-fader-top"></div>
<div class="portal-parent-fader-bottom"></div>`;
  const bottom = `\n</div></div>`;

  const noteRefContent = `${top}${noteContent}${bottom}`;

  console.log(noteRefContent);

  return (
    <div style={{ margin: 10 }}>
      {noteContent ? (
        <div dangerouslySetInnerHTML={{ __html: noteRefContent }} />
      ) : (
        <p>Loading Note Ref...</p>
      )}
    </div>
  );
}
