import { NoteProps, NotePropsDict } from "@dendronhq/common-all";
import _ from "lodash";
import { DendronRouterProps } from "./hooks";

export type NoteData = {
  notes: NotePropsDict;
  domains: NoteProps[] ;
};

export type NoteRouterQuery = {
  id: string;
};

export type DendronCommonProps = Partial<NoteData> & {dendronRouter: DendronRouterProps};


export function verifyNoteData(noteData: Partial<NoteData>): noteData is NoteData {
  const {notes} = noteData;
  return !(_.isUndefined(notes) || _.isEmpty(notes) || _.isUndefined(notes))
}

// export function verifyNoteQuery(data: Partial<NoteRouterQuery>): data is NoteRouterQuery {
//   const {id} = data;
//   return (_.isUndefined(id) || _.isEmpty(notes) || _.isUndefined(notes))
// }