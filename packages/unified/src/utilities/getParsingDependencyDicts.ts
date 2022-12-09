/* eslint-disable no-await-in-loop */
import {
  DendronASTDest,
  DNodeCompositeKey,
  DUtils,
  DVault,
  DendronConfig,
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

/**
 * For a given note to process with unified, this function determines all
 * NoteProp dependencies that will be needed in order to parse/render the note.
 * It then creates a set of NoteDicts containing all dependencies and returns
 * it. Any nested/recursive dependencies, such as with note references, will
 * also be included.
 * @param noteToProcess
 * @param engine
 * @param config
 * @param vaults
 * @returns
 */
export async function getParsingDependencyDicts(
  noteToProcess: NoteProps,
  engine: ReducedDEngine,
  config: DendronConfig,
  vaults: DVault[]
): Promise<NoteDicts> {
  let allData: NoteProps[] = [];

  allData.push(
    ...(await getForwardLinkDependencies(noteToProcess, vaults, engine, config))
  );

  allData.push(...(await getBacklinkDependencies(noteToProcess, engine)));
  allData.push(...(await getChildrenDependencies(noteToProcess, engine)));

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
 * rendering. Specifically, we look for:
 * - WIKI_LINK
 * - HASHTAG
 * - USERTAG
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
        fname: wikilink.value,
        vaultName: wikilink.data.vaultName,
      });
    }
  );

  visit(ast, [DendronASTTypes.HASHTAG], (hashtag: HashTag, _index) => {
    renderDependencies.push({
      fname: hashtag.fname,
    });
  });

  visit(ast, [DendronASTTypes.USERTAG], (noteRef: UserTag, _index) => {
    renderDependencies.push({
      fname: noteRef.fname,
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
async function getRecursiveNoteDependencies(
  ast: Node<Data>,
  engine: ReducedDEngine
): Promise<DNodeCompositeKey[]> {
  const renderDependencies: DNodeCompositeKey[] = [];
  const wildCards: { fname: string; vaultName?: string }[] = [];

  visit(
    ast,
    [DendronASTTypes.REF_LINK_V2],
    (noteRef: NoteRefNoteV4, _index) => {
      if (noteRef.data.link.from.fname.endsWith("*")) {
        wildCards.push({
          fname: noteRef.data.link.from.fname,
          vaultName: noteRef.data.link.data.vaultName,
        });
      } else {
        renderDependencies.push({
          fname: noteRef.data.link.from.fname,
          vaultName: noteRef.data.link.data.vaultName,
        });
      }
    }
  );

  // In the case that it's a wildcard note reference, then we need to include
  // the all notes that match the wildcard pattern.
  await Promise.all(
    wildCards.map(async (data) => {
      const resp = await engine.queryNotesMeta({
        qs: data.fname,
        originalQS: data.fname,
        // vault: data.vaultName
      });

      const out = _.filter(resp, (ent) =>
        DUtils.minimatch(ent.fname, data.fname)
      );

      out.forEach((value) => {
        renderDependencies.push({ fname: value.fname });
      });
    })
  );

  return renderDependencies;
}

/**
 * Get all dependencies caused by forward links. If a recursive element is
 * encountered (like a note reference), then the recursive dependencies will
 * also be included, up to a MAX_DEPTH.
 * @param noteToRender
 * @param vaults
 * @param engine
 * @param config
 * @returns
 */
async function getForwardLinkDependencies(
  noteToRender: NoteProps,
  vaults: DVault[],
  engine: ReducedDEngine,
  config: DendronConfig
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

  const recursiveDependencies = await getRecursiveNoteDependencies(ast, engine);

  allDependencies.push(...recursiveDependencies);
  curDependencies.push(...recursiveDependencies);

  while (curDepth < MAX_DEPTH && curDependencies.length > 0) {
    const newRecursiveDependencies: DNodeCompositeKey[] = [];

    await Promise.all(
      curDependencies.map(async (key) => {
        const vault = key.vaultName
          ? VaultUtils.getVaultByName({ vaults, vname: key.vaultName })
          : noteToRender.vault;

        const notes = await engine.findNotes({ fname: key.fname, vault });

        await Promise.all(
          notes.map(async (note) => {
            const proc = MDUtilsV5.procRemarkFull({
              noteToRender: note,
              fname: note.fname,
              vault: note.vault,
              config,
              dest: DendronASTDest.MD_DENDRON,
            });

            const serialized = NoteUtils.serialize(note);
            const ast = proc.parse(serialized);

            const recursiveDependencies = await getRecursiveNoteDependencies(
              ast,
              engine
            );
            allDependencies.push(...getNoteDependencies(ast));
            allDependencies.push(...recursiveDependencies);
            newRecursiveDependencies.push(...recursiveDependencies);
          })
        );
      })
    );

    curDependencies = newRecursiveDependencies;
    curDepth += 1;
  }

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
