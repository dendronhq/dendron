import {
  createFuseNote,
  DendronError,
  FuseNote,
  FuseNoteIndex,
  NoteProps,
  NotePropsDict,
} from "@dendronhq/common-all";
import { fetchFuseIndex } from "./fetchers";
import { useEffect, useState } from "react";
import _ from "lodash";
import Fuse from "fuse.js";

type FuseIndexProvider = () => Promise<FuseNoteIndex | FuseNote>;

/** The base for writing new fuse index hooks.
 *
 * To write a new fuse index hook, write a function that calls this one, and
 * just add an arrow function as the parameter. See `useGenerateFuse` for a
 * good example of what to do.
 */
function useFuse(
  notes: NotePropsDict | undefined,
  provider: FuseIndexProvider
) {
  const [error, setError] = useState<any>();
  const [loading, setLoading] = useState<boolean>(false);
  const [fuse, setFuse] = useState<FuseNote>();

  useEffect(() => {
    if (_.isUndefined(fuse)) {
      setLoading(true);
      const req = async () => {
        if (!notes) {
          return;
        }

        try {
          const value = await provider();
          if (value instanceof Fuse) {
            setFuse(value);
          } else {
            setFuse(createFuseNote(notes, {}, value));
          }
          setLoading(false);

          if (_.isUndefined(value)) {
            // Sanity check, should never happen unless `provider` typecasts an undefined
            setError(
              new DendronError({ message: "loaded index is undefined" })
            );
          }
        } catch (error) {
          setError(error);
          setLoading(false);
        }
      };

      req();
    }
  }, [fuse, notes, provider, setFuse]);

  return {
    error,
    fuse,
    loading,
  };
}

/** A react hook to fetch the exported fuse index. */
export function useFetchFuse(notes: NotePropsDict | undefined) {
  return useFuse(notes, fetchFuseIndex);
}

/** A react hook to generate the fuse index on the client side. */
export function useGenerateFuse(
  notes: NotePropsDict,
  overrideOpts?: Parameters<typeof createFuseNote>[1]
) {
  return useFuse(notes, async () => {
    return createFuseNote(notes, overrideOpts);
  });
}
