import { DendronNote } from "@dendronhq/common-frontend";
import {
  GetStaticProps,
  GetStaticPropsContext,
  InferGetStaticPropsType,
} from "next";
import React from "react";
import DendronSEO from "../components/DendronSEO";
import { getConfig, getNoteBody, getNotes } from "../utils/build";

export default function Home({
  body,
  note,
  config,
}: InferGetStaticPropsType<typeof getStaticProps>) {
  return (
    <>
      <DendronSEO note={note} config={config} />
      <DendronNote noteContent={body} />
    </>
  );
}

export const getStaticProps: GetStaticProps = async (
  context: GetStaticPropsContext
) => {
  const note = getNotes().noteIndex;
  const body = await getNoteBody(note.id);
  const config = await getConfig();
  return {
    props: {
      body,
      note,
      config,
    },
  };
};
