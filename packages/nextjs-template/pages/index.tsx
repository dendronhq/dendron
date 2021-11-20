import { GetStaticProps, GetStaticPropsContext } from "next";
import { prepChildrenForCollection } from "../components/DendronCollection";
import DendronNotePage, {
  DendronNotePageProps,
} from "../components/DendronNotePage";
import {
  getConfig,
  getCustomHead,
  getNoteBody,
  getNotes,
} from "../utils/build";

export default DendronNotePage;
export const getStaticProps: GetStaticProps = async (
  context: GetStaticPropsContext
) => {
  const { noteIndex: note, notes } = getNotes();
  const body = await getNoteBody(note.id);
  const config = await getConfig();
  const customHeadContent: string | null = await getCustomHead();
  const collectionChildren = note.custom?.has_collection
    ? prepChildrenForCollection(note, notes, note)
    : null;
  const props: DendronNotePageProps = {
    body,
    note,
    config,
    customHeadContent,
    noteIndex: note,
    collectionChildren,
  };
  return {
    props,
  };
};
