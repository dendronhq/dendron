import { FuseEngine, NoteProps } from "@dendronhq/common-all";
import { useRouter } from "next/router";
import React from "react";
import { getNoteRouterQuery } from "./etc";
import { NoteData } from "./types";

export type DendronRouterProps = ReturnType<typeof useDendronRouter>;
export type DendronLookupProps = ReturnType<typeof useDendronLookup>

export function useDendronRouter() {
  const router = useRouter();
  const query = getNoteRouterQuery(router);
  const changeActiveNote = (id: string, opts: {noteIndex: NoteProps}) => {
    if (id === opts.noteIndex.id) {
      return router.push(`/`);
    }
    return router.push(`/notes/${id}`);
  };
  return {
    router,
    query,
    changeActiveNote,
  };
}

/**
 * Get instance of fuse js
 * @param setNoteIndex 
 */
export function useDendronLookup() {
	const [noteIndex, setNoteIndex] = React.useState<FuseEngine|undefined>(undefined);
  React.useEffect(() => {
    fetch("/data/notes.json").then(async (resp) => {
      const { notes } = (await resp.json()) as NoteData;
      const noteIndex = new FuseEngine({ mode: "fuzzy" });
      noteIndex.updateNotesIndex(notes);
      setNoteIndex(noteIndex);
    });
  }, []);
	return noteIndex
}


// function useFriendStatus(friendID) {  const [isOnline, setIsOnline] = useState(null);

//   useEffect(() => {
//     function handleStatusChange(status) {
//       setIsOnline(status.isOnline);
//     }

//     ChatAPI.subscribeToFriendStatus(friendID, handleStatusChange);
//     return () => {
//       ChatAPI.unsubscribeFromFriendStatus(friendID, handleStatusChange);
//     };
//   });

//   return isOnline;
// }