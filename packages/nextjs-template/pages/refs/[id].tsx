import {
  DendronError,
  error2PlainObject,
  NoteProps,
} from "@dendronhq/common-all";
import { DendronNote } from "@dendronhq/common-frontend";
import _ from "lodash";
import {
  GetStaticPaths,
  GetStaticProps,
  GetStaticPropsContext,
  InferGetStaticPropsType,
} from "next";
import React from "react";
import DendronCustomHead from "../../components/DendronCustomHead";
import { getConfig, getNoteRefs, getRefBody } from "../../utils/build";
import { DendronCommonProps } from "../../utils/types";

export type NotePageProps = InferGetStaticPropsType<typeof getStaticProps> &
  DendronCommonProps & {
    // `InferGetStaticPropsType` doesn't get right types for some reason, hence the manual override here
    customHeadContent: string | null;
    noteIndex: NoteProps;
    note: NoteProps;
  };

export const NoteRef = ({
  note,
  body,
  collectionChildren,
  noteIndex,
  customHeadContent,
  config,
  ...rest
}: NotePageProps) => {
  return (
    <>
      {customHeadContent && <DendronCustomHead content={customHeadContent} />}
      <DendronNote noteContent={body} />
    </>
  );
}
export const getStaticPaths: GetStaticPaths = async () => {
  const ids = getNoteRefs();
  return {
    paths: _.map(ids, (id) => {
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

  try {
    const body = await getRefBody(id);

    return {
      props: {
        body,
        config: await getConfig(),
      },
    };
  } catch (err) {
    console.log(error2PlainObject(err as DendronError));
    throw err;
  }
};

export default NoteRef
