import {
  DEngineClient,
  DNodeUtils,
  DVault,
  NoteProps,
} from "@dendronhq/common-all";
import * as nodePath from "path";
import { shouldExcludePath } from "./shouldExcludePath";
import { FileType } from "./types";

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
  engine: DEngineClient;
  excludedPaths?: string[];
  excludedGlobs?: string[];
}): Promise<FileType> => {
  /* Get absolute paths to files to be excluded from visualization */
  const foldersToIgnore = [".git", ...excludedPaths];
  const fullPathFoldersToIgnore = new Set(
    foldersToIgnore.map((d) => nodePath.join(rootPath, d))
  );

  /* Given a file name, get corresponding Dendron note */
  async function getNote(fname: string): Promise<NoteProps> {
    const note = await engine.findNotes({ fname, vault });

    if (note === undefined) {
      throw new Error(`Issue trying to find the note ${fname}`);
    }

    return note[0];
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

    /* Recursively process child notes */
    const notes = (await engine.bulkGetNotes(note.children)).data;
    const children = [];
    for (const cnote of notes) {
      // eslint-disable-next-line no-await-in-loop
      const stats = await addItemToTree(cnote);
      if (stats) children.push(stats);
    }

    return { ...stats, children };
  };

  /* Get the root note */
  const note = await getNote("root");
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
