import {
  DNodeCompositeKey,
  DVault,
  IntermediateDendronConfig,
  NoteDicts,
  NoteDictsUtils,
  NoteFnameDictUtils,
  NoteProps,
  NoteUtils,
  ReducedDEngine,
} from "@dendronhq/common-all";
import _ from "lodash";
import { Data, Node } from "unist";
import visit from "unist-util-visit";
import {
  DendronASTTypes,
  HashTag,
  NoteRefNoteV4,
  UserTag,
  WikiLinkNoteV4,
} from "../types";
import { ProcDataFullOptsV5 } from "../utilsv5";
import { MDUtilsV5Web } from "../utilsWeb";

export async function getHTMLRenderDependencyNoteCache(
  noteToRender: NoteProps,
  engine: ReducedDEngine,
  config: IntermediateDendronConfig,
  vaults: DVault[]
): Promise<NoteDicts> {
  const proc = MDUtilsV5Web.procRehypeWeb(
    {
      noteToRender,
      fname: noteToRender.fname,
      vault: noteToRender.vault,
      config,
    } as ProcDataFullOptsV5 // We need this cast to avoid sending in engine.
  );

  const serialized = NoteUtils.serialize(noteToRender);

  const ast = proc.parse(serialized);

  const renderDependencies = getNoteDependencies(ast);

  // TODO: Also add in Note Ref Dependencies.

  let allData: NoteProps[] = await Promise.all(
    renderDependencies.map(async (note) => {
      const vault = _.find(vaults, (vault) => vault.name === note.vaultName);
      const notes = await engine.findNotes({ fname: note.fname, vault });
      return notes[0];
    })
  );

  allData = _.compact(allData);
  allData = _.uniqBy(allData, (value) => value.id);

  const notesById = NoteDictsUtils.createNotePropsByIdDict(allData);
  const notesByFname = NoteFnameDictUtils.createNotePropsByFnameDict(notesById);

  return {
    notesById,
    notesByFname,
  };
}

/**
 * For a given AST, find all note dependencies whose data will be needed for
 * rendering.
 * @param ast the syntax tree to look for dependencies
 * @returns an array of fname-vault? combinations that this tree depends on.
 */
export function getNoteDependencies(ast: Node<Data>): DNodeCompositeKey[] {
  const renderDependencies: DNodeCompositeKey[] = [];

  visit(
    ast,
    [DendronASTTypes.WIKI_LINK],
    (wikilink: WikiLinkNoteV4, _index) => {
      renderDependencies.push({
        fname: wikilink.value,
        vaultName: wikilink.data.vaultName,
      });
    }
  );

  visit(
    ast,
    [DendronASTTypes.REF_LINK_V2],
    (noteRef: NoteRefNoteV4, _index) => {
      renderDependencies.push({
        fname: noteRef.value,
        vaultName: noteRef.data.vaultName,
      });
    }
  );

  visit(ast, [DendronASTTypes.HASHTAG], (hashtag: HashTag, _index) => {
    renderDependencies.push({
      fname: hashtag.value,
    });
  });

  visit(ast, [DendronASTTypes.USERTAG], (noteRef: UserTag, _index) => {
    renderDependencies.push({
      fname: noteRef.value,
    });
  });

  return renderDependencies;
}

/**
 * For a given AST, find all note dependencies which will cause recursive
 * dependencies. Currently, only note references will cause this (since we need
 * to render the body of the note reference.)
 * @param ast the syntax tree to look for recursive dependencies
 * @returns an array of fname-vault? combinations that this tree depends on.
 */
export function getRecursiveNoteDependencies(
  ast: Node<Data>
): DNodeCompositeKey[] {
  const renderDependencies: DNodeCompositeKey[] = [];

  visit(
    ast,
    [DendronASTTypes.REF_LINK_V2],
    (noteRef: NoteRefNoteV4, _index) => {
      renderDependencies.push({
        fname: noteRef.value,
        vaultName: noteRef.data.vaultName,
      });
    }
  );

  return renderDependencies;
}
