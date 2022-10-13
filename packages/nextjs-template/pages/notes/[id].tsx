import { DendronError, error2PlainObject } from "@dendronhq/common-all";
import _ from "lodash";
import { GetStaticPaths, GetStaticProps } from "next";
import { prepChildrenForCollection } from "../../components/DendronCollection";
import DendronNotePage, {
  DendronNotePageProps,
} from "../../components/DendronNotePage";
import {
  DendronNotePageParams,
  getConfig,
  getCustomHead,
  getNoteBody,
  getNoteMeta,
  getNotePaths,
  getNotes,
} from "../../utils/build";

export default DendronNotePage;

export const getStaticPaths: GetStaticPaths<DendronNotePageParams> =
  getNotePaths;

export const getStaticProps: GetStaticProps<
  DendronNotePageProps,
  DendronNotePageParams
> = async ({ params }) => {
  if (!params) {
    throw Error("params required");
  }

  const { id } = params;

  if (!_.isString(id)) {
    throw Error("id required");
  }

  try {
    const [body, note] = await Promise.all([getNoteBody(id), getNoteMeta(id)]);
    const noteData = getNotes();
    const customHeadContent: string | null = await getCustomHead();
    const { notes, noteIndex } = noteData;
    const collectionChildren = note.custom?.has_collection
      ? prepChildrenForCollection(note, notes)
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
