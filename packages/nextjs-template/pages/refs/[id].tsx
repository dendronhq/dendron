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
import {
  getConfig,
  getNoteMeta,
  getNoteRefs,
  getRefBody,
} from "../../utils/build";
import { DendronCommonProps } from "../../utils/types";

export type NotePageProps = InferGetStaticPropsType<typeof getStaticProps> &
  DendronCommonProps & {
    // `InferGetStaticPropsType` doesn't get right types for some reason, hence the manual override here
    customHeadContent: string | null;
    noteIndex: NoteProps;
    note: NoteProps;
  };

export default function NoteRef({
  note,
  body,
  collectionChildren,
  noteIndex,
  customHeadContent,
  config,
  ...rest
}: NotePageProps) {
  return (
    <>
      {customHeadContent && <DendronCustomHead content={customHeadContent} />}
      <DendronNote noteContent={body} config={config} />
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
    const body = await getRefBody(id);
    // strip the lass 4 from id.  ie, -001 (need to figure out where that comes from)
    const baseId = id.substring(0, id.length - 4);
    const metaData = await getNoteMeta(baseId);

    const noteUrl = `/notes/${baseId}/`
    // i think fname would be better, title is parity
    const noteTitle = metaData.title;


    return {
      props: {
        body,
        config: await getConfig(),
        noteUrl,
        noteTitle
      },
    };
  } catch (err) {
    console.log(error2PlainObject(err as DendronError));
    throw err;
  }
};
