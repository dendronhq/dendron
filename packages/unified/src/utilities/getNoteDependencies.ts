/* eslint-disable no-await-in-loop */
import {
  DendronASTDest,
  DNodeCompositeKey,
  DVault,
  IntermediateDendronConfig,
  NoteDicts,
  NoteDictsUtils,
  NoteProps,
  NoteUtils,
  ReducedDEngine,
  VaultUtils,
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
import { MDUtilsV5 } from "../utilsv5";

export async function getHTMLRenderDependencyNoteCache(
  noteToRender: NoteProps,
  engine: ReducedDEngine,
  config: IntermediateDendronConfig,
  vaults: DVault[]
): Promise<NoteDicts> {
  let allData: NoteProps[] = [];

  allData.push(
    ...(await getForwardLinkDependencies(noteToRender, vaults, engine, config))
  );

  allData.push(...(await getBacklinkDependencies(noteToRender, engine)));
  allData.push(...(await getChildrenDependencies(noteToRender, engine)));

  allData = _.compact(allData);
  allData = _.uniqBy(allData, (value) => value.id);

  return NoteDictsUtils.createNoteDicts(allData);
}

async function getChildrenDependencies(
  noteToRender: NoteProps,
  engine: ReducedDEngine
): Promise<NoteProps[]> {
  const results: NoteProps[] = [];

  // Also include children to render the 'children' hierarchy at the footer of the page:
  await Promise.all(
    noteToRender.children.map(async (childId) => {
      // TODO: Can we use a bulk get API instead (if/when it exists) to speed
      // up fetching time
      const childNote = await engine.getNote(childId);

      if (childNote.data) {
        results.push(childNote.data);
      }
    })
  );

  return results;
}

async function getBacklinkDependencies(
  noteToRender: NoteProps,
  engine: ReducedDEngine
): Promise<NoteProps[]> {
  const results = await Promise.all(
    noteToRender.links
      .filter((link) => link.type === "backlink" && link.from.id)
      .map(async (link) => {
        const linkedNote = await engine.getNote(link.from.id!);
        if (linkedNote.data) {
          return linkedNote.data;
        }
        return undefined;
      })
  );

  return _.uniqBy(_.compact(results), (value) => value.id);
}

/**
 * For a given AST, find all note dependencies whose data will be needed for
 * rendering.
 * @param ast the syntax tree to look for dependencies
 * @returns an array of fname-vault? combinations that this tree depends on.
 */
function getNoteDependencies(ast: Node<Data>): DNodeCompositeKey[] {
  const renderDependencies: DNodeCompositeKey[] = [];

  visit(
    ast,
    [DendronASTTypes.WIKI_LINK],
    (wikilink: WikiLinkNoteV4, _index) => {
      renderDependencies.push({
        fname: wikilink.value, //JYTODO: I think this is wrong for cross vault links.
        vaultName: wikilink.data.vaultName,
      });
    }
  );

  visit(
    ast,
    [DendronASTTypes.REF_LINK_V2],
    (noteRef: NoteRefNoteV4, _index) => {
      renderDependencies.push({
        fname: noteRef.data.link.from.fname,
        vaultName: noteRef.data.link.data.vaultName,
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
function getRecursiveNoteDependencies(ast: Node<Data>): DNodeCompositeKey[] {
  const renderDependencies: DNodeCompositeKey[] = [];

  visit(
    ast,
    [DendronASTTypes.REF_LINK_V2],
    (noteRef: NoteRefNoteV4, _index) => {
      renderDependencies.push({
        fname: noteRef.data.link.from.fname,
        vaultName: noteRef.data.link.data.vaultName,
      });
    }
  );

  return renderDependencies;
}

async function getForwardLinkDependencies(
  noteToRender: NoteProps,
  vaults: DVault[],
  engine: ReducedDEngine,
  config: IntermediateDendronConfig
): Promise<NoteProps[]> {
  const MAX_DEPTH = 3;

  let curDepth = 1;

  const allDependencies: DNodeCompositeKey[] = [];
  let curDependencies: DNodeCompositeKey[] = [];

  // Initialize curDependencies:
  const proc = MDUtilsV5.procRemarkFull({
    noteToRender,
    fname: noteToRender.fname,
    vault: noteToRender.vault,
    config,
    dest: DendronASTDest.MD_DENDRON,
  });

  const serialized = NoteUtils.serialize(noteToRender);
  const ast = proc.parse(serialized);

  allDependencies.push(...getNoteDependencies(ast));
  curDependencies.push(...getRecursiveNoteDependencies(ast));

  while (curDepth < MAX_DEPTH && curDependencies.length > 0) {
    const newRecursiveDependencies: DNodeCompositeKey[] = [];

    await Promise.all(
      curDependencies.map(async (key) => {
        const vault = key.vaultName
          ? VaultUtils.getVaultByName({ vaults, vname: key.vaultName })
          : noteToRender.vault;

        const notes = await engine.findNotes({ fname: key.fname, vault });

        notes.forEach((note) => {
          const proc = MDUtilsV5.procRemarkFull({
            noteToRender: note,
            fname: note.fname,
            vault: note.vault,
            config,
            dest: DendronASTDest.MD_DENDRON,
          });

          const serialized = NoteUtils.serialize(note);
          const ast = proc.parse(serialized);

          allDependencies.push(...getNoteDependencies(ast));
          newRecursiveDependencies.push(...getRecursiveNoteDependencies(ast));
        });
      })
    );

    curDependencies = newRecursiveDependencies;
    curDepth += 1;
  }

  // TODO: Account for wildcard wikilink syntax. See gatherNoteRefs.

  let allData: NoteProps[] = [];

  await Promise.all(
    allDependencies.map(async (dependency) => {
      const vault = dependency.vaultName
        ? _.find(vaults, (vault) => vault.name === dependency.vaultName)
        : undefined;
      const notes = await engine.findNotes({ fname: dependency.fname, vault });
      allData.push(...notes);
    })
  );

  allData = _.compact(allData);
  allData = _.uniqBy(allData, (value) => value.id);

  return allData;
}
