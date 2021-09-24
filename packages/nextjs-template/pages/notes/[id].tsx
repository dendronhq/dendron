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
import DendronCustomHead from "../../components/DendronCustomHead";
import DendronSpinner from "../../components/DendronSpinner";
import {
  DendronCollectionItem,
  prepChildrenForCollection,
} from "../../components/DendronCollection";
import { useCombinedDispatch, useCombinedSelector } from "../../features";
import { browserEngineSlice } from "../../features/engine";
import {
  getConfig,
  getCustomHead,
  getNoteBody,
  getNoteMeta,
  getNotes,
} from "../../utils/build";
import { DendronCommonProps, NoteRouterQuery } from "../../utils/types";
import {
  DendronError,
  error2PlainObject,
  NoteProps,
} from "@dendronhq/common-all";

export type NotePageProps = InferGetStaticPropsType<typeof getStaticProps> &
  DendronCommonProps & {
    // `InferGetStaticPropsType` doesn't get right types for some reason, hence the manual override here
    customHeadContent: string | null;
    noteIndex: NoteProps;
    note: NoteProps;
  };

export default function Note({
  note,
  body,
  collectionChildren,
  noteIndex,
  customHeadContent,
  config,
  ...rest
}: NotePageProps) {
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

  if (_.isUndefined(noteBody) || engine.loading === LoadingStatus.PENDING) {
    return <DendronSpinner />;
  }

  const maybeCollection = note.custom?.has_collection
    ? collectionChildren.map((child: NoteProps) =>
        DendronCollectionItem({ note: child, noteIndex })
      )
    : null;

  return (
    <>
      <DendronSEO note={note} config={config} />
      {customHeadContent && <DendronCustomHead content={customHeadContent} />}
      <DendronNote noteContent={noteBody} />
      {maybeCollection}
    </>
  );
}
export const getStaticPaths: GetStaticPaths = async () => {
  const { notes, noteIndex } = getNotes();
  const ids = _.reject(_.keys(notes), (id) => id === noteIndex.id);
  return {
    paths: _.map(ids, (id) => {
      return { params: { id } };
    }),
    fallback: false,
  };
};

// @ts-ignore
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

  try {
    const [body, note] = await Promise.all([getNoteBody(id), getNoteMeta(id)]);
    const noteData = getNotes();
    const customHeadContent: string | null = await getCustomHead();
    const { notes, noteIndex } = noteData;
    const collectionChildren = note.custom?.has_collection
      ? prepChildrenForCollection(note, notes, noteIndex)
      : null;

    return {
      props: {
        note,
        body,
        noteIndex,
        collectionChildren,
        customHeadContent,
        config: await getConfig(),
      },
    };
  } catch (err) {
    console.log(error2PlainObject(err as DendronError));
    throw err;
  }
};
