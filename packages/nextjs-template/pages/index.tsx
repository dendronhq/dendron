import { DendronNote } from "@dendronhq/common-frontend";
import {
  GetStaticProps,
  GetStaticPropsContext,
  InferGetStaticPropsType,
} from "next";
import React from "react";
import { getNoteBody, getNotes } from "../utils/build";

export default function Home({
  body,
}: InferGetStaticPropsType<typeof getStaticProps>) {
  return <DendronNote noteContent={body} />;
}

export const getStaticProps: GetStaticProps = async (
  context: GetStaticPropsContext
) => {
  const note = getNotes().noteIndex;
  const body = await getNoteBody(note.id);
  return {
    props: {
      body,
      note,
    },
  };
};
