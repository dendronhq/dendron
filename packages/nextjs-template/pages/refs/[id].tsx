import { DendronError, error2PlainObject } from "@dendronhq/common-all";
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
import { getNoteRefs, getRefBody } from "../../utils/build";
import { DendronCommonProps } from "../../utils/types";

type NotePageProps = InferGetStaticPropsType<typeof getStaticProps> &
  DendronCommonProps & {
    customHeadContent: string | null;
  };

export default function NoteRef({ body, customHeadContent }: NotePageProps) {
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
      },
    };
  } catch (err) {
    // eslint-disable-next-line no-console
    console.log(error2PlainObject(err as DendronError));
    throw err;
  }
};
