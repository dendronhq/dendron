import {
  DEngine,
  DNodeUtils,
  DVault,
  NoteProps,
  NoteUtils,
} from "@dendronhq/common-all";
import * as nodePath from "path";
import { shouldExcludePath } from "./should-exclude-path";
import { FileType } from "./types";

//TODO: What does dir stand for (directory)? Can a directory be passed as an argument or only markdown files?
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
}): Promise<FileType> => {
  /* Get absolute paths to files to be excluded from visualization */
  const foldersToIgnore = [".git", ...excludedPaths];
  const fullPathFoldersToIgnore = new Set(
    foldersToIgnore.map((d) => nodePath.join(rootPath, d))
  );

  /* Given a file name, get corresponding Dendron note */
  function getNote(fname: string): NoteProps {
    const note = NoteUtils.getNoteByFnameFromEngine({ fname, engine, vault });
    if (note === undefined) {
      throw new Error(`Issue trying to find the note ${fname}`);
    }
    return note;
  }

  /* Given a note, get its child notes */
  function getChildren(note: NoteProps): NoteProps[] {
    return note.children.map((id) => engine.notes[id]);
  }

  /* Given a note, get file stats needed for Tree React component */
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

  /* Get file stats of the given note and its children */
  const addItemToTree = async (note: NoteProps): Promise<FileType | null> => {
    /* Check if a given note should be included in the visualization */
    const fullPath = nodePath.join(vault.fsPath, note.fname);
    if (shouldExcludePath(fullPath, fullPathFoldersToIgnore, excludedGlobs))
      return null;

    const stats = await getFileStats(note);

    // /* If the note doesn't have any children, just return its file stats */
    // if (!isDir) return stats;

    /* Recursively process child notes */
    const notes = getChildren(note);
    const children = [];
    for (const cnote of notes) {
      // eslint-disable-next-line no-await-in-loop
      const stats = await addItemToTree(cnote);
      if (stats) children.push(stats);
    }

    return { ...stats, children };
  };

  /* Get the root note */
  const note = getNote("root");
  /* Recursively traverse all notes and get file stats needed for Tree React component */
  const tree = await addItemToTree(note);

  /* If file stats of the root note cannot be obtained, throw an error */
  if (tree === null) {
    throw Error(
      "Error: Issue processing workspace. Check if --wsRoot is set correctly.`"
    );
  }

  return tree;
};
