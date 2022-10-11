import { GetStaticProps } from "next";
import { prepChildrenForCollection } from "../components/DendronCollection";
import { DendronNotePageProps } from "../components/DendronNotePage";
import { getConfig, getCustomHead, getNoteBody, getNotes } from "./build";

export const getStaticProps: GetStaticProps = async () => {
  const { noteIndex: note, notes } = getNotes();
  const body = await getNoteBody(note.id);
  const config = await getConfig();
  const customHeadContent: string | null = await getCustomHead();
  const collectionChildren = note.custom?.has_collection
    ? prepChildrenForCollection(note, notes)
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
