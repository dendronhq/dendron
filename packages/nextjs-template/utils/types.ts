import { NoteProps, NotePropsDict } from "@dendronhq/common-all";

export type NoteData = {
  notes: NotePropsDict;
  domains: NoteProps[] ;
};

export type NoteRouterQuery = {
  id: string;
};