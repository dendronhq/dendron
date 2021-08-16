import { NextRouter, useRouter } from "next/router";
import { NoteRouterQuery } from "./types";

export function getNoteRouterQuery(router: NextRouter) {
  return router.query as Partial<NoteRouterQuery>;
}
