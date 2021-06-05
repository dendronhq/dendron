import { NoteProps } from "@dendronhq/common-all";
import {
  createLogger,
  engineHooks,
  engineSlice,
} from "@dendronhq/common-frontend";
import { useRouter } from "next/router";
import React from "react";
import { getWsAndPort } from "../../lib/env";
import { DendronProps } from "../../lib/types";

export default function MiniPreview({ engine, ide }: DendronProps) {
  const logger = createLogger("MiniPreview");
  logger.info({ msg: "enter" });
  const [note, setNote] = React.useState<NoteProps>();
  const router = useRouter();
  const dispatch = engineHooks.useEngineAppDispatch();
  const { isReady } = router;
  if (!isReady) {
    return <> </>;
  }
  const noteId = ide.noteActive?.id;
  React.useEffect(() => {
    if (!noteId) {
      logger.info({ msg: "no noteId" });
      return;
    }
    const maybeContent = engine.notesRendered[noteId];
    if (!maybeContent) {
      dispatch(engineSlice.renderNote({ ...getWsAndPort(), id: noteId }));
    }
  }, [ide.noteActive, engine.notesRendered]);

  if (!noteId) {
    return <>Loading..</>;
  }
  if (!engine.notesRendered[noteId]) {
    return <>Loading..</>;
  }
  return (
    <div dangerouslySetInnerHTML={{ __html: engine.notesRendered[noteId]! }} />
  );
}
