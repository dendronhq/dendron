import { DNodeCompositeKey } from "@dendronhq/common-all";
import { Node, Data } from "unist";
import visit from "unist-util-visit";
import {
  DendronASTTypes,
  WikiLinkNoteV4,
  NoteRefNoteV4,
  HashTag,
  UserTag,
} from "../types";

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
