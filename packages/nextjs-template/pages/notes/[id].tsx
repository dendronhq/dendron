import {
  createLogger,
  DendronNote,
  LoadingStatus,
} from "@dendronhq/common-frontend";
import _ from "lodash";
import {
  GetStaticPaths,
  GetStaticProps,
  GetStaticPropsContext,
  InferGetStaticPropsType,
} from "next";
import { useRouter } from "next/router";
import React from "react";
import DendronSEO from "../../components/DendronSEO";
import DendronSpinner from "../../components/DendronSpinner";
import { useCombinedDispatch, useCombinedSelector } from "../../features";
import { browserEngineSlice } from "../../features/engine";
import { getNoteBody, getNoteMeta, getNotes } from "../../utils/build";
import { DendronCommonProps, NoteRouterQuery } from "../../utils/types";

export type NotePageProps = InferGetStaticPropsType<typeof getStaticProps> &
  DendronCommonProps;

export default function Note({ note, body, ...rest }: NotePageProps) {
  const logger = createLogger("Note");
  const router = useRouter();
  const [bodyFromState, setBody] =
    React.useState<string | undefined>(undefined);
  const { id } = router.query as NoteRouterQuery;

  // --- Hooks
  const dispatch = useCombinedDispatch();
  const engine = useCombinedSelector((state) => state.engine);
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
        browserEngineSlice.actions.setLoadingStatus(LoadingStatus.FUFILLED)
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
        browserEngineSlice.actions.setLoadingStatus(LoadingStatus.FUFILLED)
      );
    });
  }, [id]);

  const noteBody = id === note.id ? body : bodyFromState;

  if (_.isUndefined(noteBody) || engine.loading === LoadingStatus.PENDING) {
    return <DendronSpinner />;
  }

  return (
    <>
      <DendronSEO />
      <DendronNote noteContent={noteBody} />
    </>
  );
}
export const getStaticPaths: GetStaticPaths = async () => {
  const { notes } = getNotes();
  return {
    paths: _.map(notes, (_note, id) => {
      return { params: { id } };
    }),
    fallback: false,
  };
};

export const getStaticProps: GetStaticProps = async (
  context: GetStaticPropsContext
) => {
  const { params } = context;
  if (!params) {
    throw Error("params required");
  }
  const id = params["id"];
  if (!_.isString(id)) {
    throw Error("id required");
  }
  const [body, note] = await Promise.all([getNoteBody(id), getNoteMeta(id)]);
  return {
    props: {
      body,
      note,
    },
  };
};
