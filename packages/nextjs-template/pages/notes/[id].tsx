import { FuseEngine } from "@dendronhq/common-all";
import { createLogger, DendronNote } from "@dendronhq/common-frontend";
import _ from "lodash";
import {
  GetStaticPaths,
  GetStaticProps,
  GetStaticPropsContext,
  InferGetStaticPropsType,
} from "next";
import { useRouter } from "next/router";
import React from "react";
import {
  getDataDir,
  getNoteBody,
  getNoteMeta,
  getNotes,
} from "../../utils/build";
import { DendronCommonProps, NoteRouterQuery } from "../../utils/types";

export default function Note({
  note,
  body,
  ...rest
}: InferGetStaticPropsType<typeof getStaticProps> & DendronCommonProps) {
  const logger = createLogger("Note");
  const router = useRouter();
  const [bodyFromState, setBody] =
    React.useState<string | undefined>(undefined);
  const [noteIndex, setNoteIndex] =
    React.useState<FuseEngine | undefined>(undefined);
  const { id } = router.query as NoteRouterQuery;
  logger.info({ ctx: "enter" });
  // setup body
  React.useEffect(() => {
    if (_.isUndefined(id)) {
      return;
    }
    // loaded page statically
    if (id === note.id) {
      return;
    }
    // otherwise, dynamically fetch page
    fetch(`/data/notes/${id}.html`).then(async (resp) => {
      const contents = await resp.text();
      setBody(contents);
    });
  }, [id]);

  let noteBody = id === note.id ? body : bodyFromState;

  if (_.isUndefined(noteBody)) {
    return <>Loading...</>;
  }

  return (
    <>
      <DendronNote noteContent={noteBody} />
    </>
  );
}
export const getStaticPaths: GetStaticPaths = async () => {
  const dataDir = getDataDir();
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
