import { DendronError, error2PlainObject } from "@dendronhq/common-all";
import _ from "lodash";
import { GetStaticPaths, GetStaticProps, GetStaticPropsContext } from "next";
import { prepChildrenForCollection } from "../../components/DendronCollection";
import DendronNotePage, {
  DendronNotePageProps,
} from "../../components/DendronNotePage";
import {
  getConfig,
  getCustomHead,
  getNoteBody,
  getNoteMeta,
  getNotes,
} from "../../utils/build";

export default DendronNotePage;

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
    const props: DendronNotePageProps = {
      note,
      body,
      noteIndex,
      collectionChildren,
      customHeadContent,
      config: await getConfig(),
    };

    return {
      props,
    };
  } catch (err) {
    // eslint-disable-next-line no-console
    console.log(error2PlainObject(err as DendronError));
    throw err;
  }
};
