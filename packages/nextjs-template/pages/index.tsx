import { createLogger, DendronNote } from "@dendronhq/common-frontend";
import _ from "lodash";
import {
  GetStaticPaths,
  GetStaticProps,
  GetStaticPropsContext,
  InferGetStaticPropsType
} from "next";
import { useRouter } from "next/router";
import React from "react";
import { getNoteBody, getNotes } from "../utils/build";
import Note, { NotePageProps } from "./notes/[id]";

export default function Home({body}: InferGetStaticPropsType<typeof getStaticProps>) {
  return <DendronNote noteContent={body} />
}

export const getStaticProps: GetStaticProps = async (
  context: GetStaticPropsContext
) => {
  const note = getNotes().noteIndex;
  const body = await getNoteBody(note.id)
  return {
    props: {
      body,
      note,
    },
  };
};
