import {
  DEngine,
  DNodeUtils,
  DVault,
  NoteProps,
  NoteUtils,
} from "@dendronhq/common-all";
import * as nodePath from "path";
import { shouldExcludePath } from "./should-exclude-path";

function isDir(note: NoteProps) {
  return note.children.length !== 0;
}

export const processDir = async ({
  rootPath = "",
  engine,
  vault,
  excludedPaths = [],
  excludedGlobs = [],
}: {
  rootPath: string;
  vault: DVault;
  engine: DEngine;
  excludedPaths?: string[];
  excludedGlobs?: string[];
}) => {
  const foldersToIgnore = [".git", ...excludedPaths];
  const fullPathFoldersToIgnore = new Set(
    foldersToIgnore.map((d) => nodePath.join(rootPath, d))
  );

  function getNote(fname: string): NoteProps {
    return NoteUtils.getNoteByFnameFromEngine({ fname, engine, vault });
  }

  function getChildren(note: NoteProps): NoteProps[] {
    return note.children.map((id) => engine.notes[id]);
  }

  const getFileStats = async (note: NoteProps) => {
    const suffix = isDir(note) ? "" : ".md";
    const name = DNodeUtils.basename(note.fname);
    const size = note.body.length;
    return {
      name,
      path: note.fname + suffix,
      size,
    };
  };

  const addItemToTree = async (note: NoteProps) => {
    try {
      console.log("Looking in ", `${note.fname}`);

      if (isDir(note)) {
        const notes = getChildren(note);

        const children = [];

        for (const cnote of notes) {
          const fullPath = nodePath.join(vault.fsPath, cnote.fname);
          if (
            shouldExcludePath(fullPath, fullPathFoldersToIgnore, excludedGlobs)
          ) {
            continue;
          }

          const stats = await addItemToTree(cnote);
          if (stats) children.push(stats);
        }

        const stats = await getFileStats(note);
        return { ...stats, children };
      }

      // if (shouldExcludePath(path, fullPathFoldersToIgnore, excludedGlobs)) {
      //   return null;
      // }
      const stats = getFileStats(note);
      return stats;
    } catch (e) {
      console.log("Issue trying to read file", note.fname, e);
      return null;
    }
  };

  const note = getNote("root");
  const tree = await addItemToTree(note);

  return tree;
};
