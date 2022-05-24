import { DVault } from "./workspace";

export type FindNoteOpts = {
  fname: string;
  // If vault is provided, filter results so that only notes with matching vault is returned
  vault?: DVault;
};
