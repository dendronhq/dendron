import { NoteProps, NotePropsDict } from "@dendronhq/common-all";
import _ from "lodash";
import { DendronRouterProps } from "./hooks";

declare global {
  interface Window {
    CommandBar: any;
  }
}

export type NoteData = {
  /**
   * All notes that are published
   */
  notes: NotePropsDict;
  /**
   * All top level domains that are published
   */
  domains: NoteProps[] ;
  /**
   * The note for the home page
   */
  noteIndex: NoteProps;
};

export type NoteRouterQuery = {
  id: string;
};

export type DendronCommonProps = Partial<NoteData> & {dendronRouter: DendronRouterProps};
export type DendronPageWithNoteDataProps = NoteData & {dendronRouter: DendronRouterProps};

export function verifyNoteData(noteData: Partial<NoteData>): noteData is NoteData {
  const {notes} = noteData;
  return !(_.isUndefined(notes) || _.isEmpty(notes) || _.isUndefined(notes))
}

// export function verifyNoteQuery(data: Partial<NoteRouterQuery>): data is NoteRouterQuery {
//   const {id} = data;
//   return (_.isUndefined(id) || _.isEmpty(notes) || _.isUndefined(notes))
// }