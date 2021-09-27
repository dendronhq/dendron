import { DendronNote } from "@dendronhq/common-frontend";
import {
  GetStaticProps,
  GetStaticPropsContext,
  InferGetStaticPropsType,
} from "next";
import React, { ReactElement } from "react";
import DendronLayout from "../components/DendronLayout";
import DendronSEO from "../components/DendronSEO";
import { getConfig, getNoteBody, getNotes } from "../utils/build";

export const Home = ({
  body,
  note,
  config,
}: InferGetStaticPropsType<typeof getStaticProps>) => {
  return (
    <>
      <DendronSEO note={note} config={config} />
      <DendronNote noteContent={body} />
    </>
  );
}

Home.getLayout = (page: ReactElement, props: any = {} ) => (<DendronLayout {...props}>{page}</DendronLayout>);

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

export default Home;
