import {
  cleanName,
  DendronASTDest,
  DendronConfig,
  DLink,
  DLogger,
  DVault,
  genHash,
  genUUID,
  NoteDictsUtils,
  NoteProps,
  NotePropsMeta,
  NoteUtils,
  Position,
  SchemaModuleDict,
  SchemaUtils,
  string2Note,
  Time,
} from "@dendronhq/common-all";
import {
  DendronASTNode,
  DendronASTTypes,
  LinkUtils,
  MDUtilsV5,
  ProcMode,
  visit,
} from "@dendronhq/unified";
import fs from "fs-extra";
import _ from "lodash";
import { Text } from "mdast";
import { err, ok, okAsync, Result, ResultAsync } from "neverthrow";
import path from "path";
import { Database } from "sqlite3";
import { Parent } from "unist";
import {
  executeSqlWithVoidResult,
  HierarchyTableUtils,
  VaultNotesTableRow,
  VaultNotesTableUtils,
  VaultsTableUtils,
} from "../sqlite";
import { SqliteError } from "../sqlite/SqliteError";
import { LinksTableUtils, LinkType } from "../sqlite/tables/LinksTableUtils";
import { NotePropsTableUtils } from "../sqlite/tables/NotePropsTableUtils";
import { SchemaNotesTableUtils } from "../sqlite/tables/SchemaNotesTableUtils";

/**
 * Given the files in a particular vault, process all of them to update the
 * Sqlite database appropriately. This function will take into account existing
 * database state to perform a 'delta initialization' by only making
 * modifications to the db state based on changes that happened in the file
 * system while the database was offline (i.e. the user did not have Dendron
 * running.)
 * @param files - the fsPaths of all note files to be processed
 * @param vault - the vault in which these files belong. To process multiple
 * vaults, call this function multiple times, once for each vault.
 * @param db
 * @param root
 * @param schemas
 * @param enableLinkCandidates
 * @returns
 */
export async function parseAllNoteFilesForSqlite(
  files: string[],
  vault: DVault,
  db: Database,
  root: string,
  schemas: SchemaModuleDict,
  enableLinkCandidates: boolean = false,
  logger?: DLogger
): Promise<Result<null, any>> {
  const ctx = "parseAllNoteFilesForSqlite";
  logger?.info({ ctx, msg: "pre:parseAllNoteFilesForSqlite" });

  // Add the vault to the DB if it doesn't exist yet
  await addVaultToDb(vault, db);

  const vaultIdResp = await VaultsTableUtils.getIdByFsPath(db, vault.fsPath);

  let vaultId: number;

  if (vaultIdResp.isOk()) {
    vaultId = vaultIdResp.value;
  } else {
    return err(vaultIdResp.error);
  }

  // Get the content from all files and calculate their hashes
  const fileStateData = files.map((file) => {
    const content = fs.readFileSync(path.join(root, file), {
      encoding: "utf8",
    });
    const { name } = path.parse(file);

    return { fname: cleanName(name), contentHash: genHash(content), content };
  });

  const contentDictionary: { [key: string]: string } = {};
  for (const data of fileStateData) {
    contentDictionary[data.fname] = data.content;
  }

  // Compute which files are newly added (as compared with the current db state)
  const addedFileResp = await getAddedFiles(db, files, vaultId);

  if (addedFileResp.isErr()) {
    return err(addedFileResp.error);
  }

  // Calculate content hashes for all newly added files
  const addedNotes: NoteProps[] = addedFileResp.value.map((fname) => {
    const content = contentDictionary[fname];

    const props = string2Note({ content, fname: cleanName(fname), vault });
    props.contentHash = genHash(content);

    return props;
  });

  // Compute which files were updated by examining hashes (as compared with the current db state)
  const getUpdatedFilesResp = await getUpdatedFiles(db, fileStateData, vaultId);

  if (getUpdatedFilesResp.isErr()) {
    return err(getUpdatedFilesResp.error);
  }

  const updatedNotes: NoteProps[] = getUpdatedFilesResp.value.map((fname) => {
    const content = contentDictionary[fname];

    const props = string2Note({ content, fname: cleanName(fname), vault });
    props.contentHash = genHash(content);

    return props;
  });

  if (updatedNotes.length > 0) {
    // We need to delete all links from updated notes, since they will get re-processed
    const linkDeleteRes = await deleteLinksForUpdatedNotes(
      db,
      updatedNotes.map((props) => props.fname),
      vaultId
    );

    if (linkDeleteRes.isErr()) {
      return err(linkDeleteRes.error);
    }
  }

  // For all deleted notes, remove them from the DB
  const deleteRes = await deleteRemovedFilesFromDB(
    db,
    Object.keys(contentDictionary),
    vaultId
  );

  if (deleteRes.isErr()) {
    return err(deleteRes.error);
  }

  // Schemas - only needs to be processed for added notes.
  const dicts = NoteDictsUtils.createNoteDicts(addedNotes);
  const domains = addedNotes.filter((note) => !note.fname.includes("."));

  domains.map((domain) => {
    SchemaUtils.matchDomain(domain, dicts.notesById, schemas);
  });

  const allNotesToProcess = addedNotes.concat(updatedNotes);

  // Now add entries into the NoteProps table for all added and updated notes
  // TODO: Bulk Insert
  await Promise.all(
    allNotesToProcess.map((note) => {
      return processNoteProps(note, db);
    })
  );

  // We need to do additional processing on updated links if any of them have
  // had their ID's changed.
  if (updatedNotes.length > 0) {
    // NOTE: This step must be done AFTER the updated notes have been added, or
    // else the foreign key constraint on the Links table will fail.
    const updateLinksForChangedNoteIdResult = await updateLinksForChangedNoteId(
      db,
      updatedNotes,
      vaultId
    );
    if (updateLinksForChangedNoteIdResult.isErr()) {
      return err(updateLinksForChangedNoteIdResult.error);
    }

    // If any updated notes had an ID change, then we also need to delete any
    // references to the old ID in NoteProps, Parent-child links and VaultNotes:
    const purgeChangedIdsResult = await purgeDBForUpdatedNotesWithChangedNoteId(
      db,
      updatedNotes,
      vaultId
    );
    if (purgeChangedIdsResult.isErr()) {
      return err(purgeChangedIdsResult.error);
    }
  }

  // For any added notes, check if this caused a previously unresolved
  // wikilink/ref to now become a properly resolved link. If so, go ahead and
  // update it in the Links table.
  if (addedNotes.length > 0) {
    const updateUnresolvedLinksForAddedNotesResult =
      await LinksTableUtils.updateUnresolvedLinksForAddedNotes(
        db,
        addedNotes,
        vault.name ?? vault.fsPath
      );

    if (updateUnresolvedLinksForAddedNotesResult.isErr()) {
      return err(updateUnresolvedLinksForAddedNotesResult.error);
    }

    const insertLinksThatBecameAmbiguousResult =
      await LinksTableUtils.InsertLinksThatBecameAmbiguous(
        db,
        addedNotes.map((props) => {
          return { fname: props.fname, id: props.id };
        })
      );

    if (insertLinksThatBecameAmbiguousResult.isErr()) {
      return err(insertLinksThatBecameAmbiguousResult.error);
    }

    // For all added notes, add any hierarchy stubs that are necessary to
    // establish a fully connected hierarchy tree. NOTE: Hierarchy stubs need to
    // be added PRIOR to parent link processing.
    const addHierarchyStubsForAddedNotesResult = await addAncestorStubs(
      db,
      addedNotes,
      vaultId
    );

    if (addHierarchyStubsForAddedNotesResult.isErr()) {
      return err(addHierarchyStubsForAddedNotesResult.error);
    } else {
      // We also need to process any added stubs to properly setup the hierarchy
      // table, so add them to the list of notes to process
      allNotesToProcess.push(...addHierarchyStubsForAddedNotesResult.value);
    }

    // Stubs that got replaced by real notes require additional processing - we
    // must delete the stub notes being replaced and also replace their
    // parent->child links in the hierarchy table with the newly added non-stub
    // versions
    const processReplacedStubsResult = await processReplacedStubs(
      db,
      addedNotes,
      vaultId
    );

    if (processReplacedStubsResult.isErr()) {
      return err(processReplacedStubsResult.error);
    }
  }

  // For all added/updated notes, add their child->parent linkages now
  const bulkProcessParentLinksResult = await processParentLinks(
    db,
    allNotesToProcess,
    vaultId
  );

  if (bulkProcessParentLinksResult.isErr()) {
    return err(bulkProcessParentLinksResult.error);
  }

  // For all added/updated notes, process their links (wikilinks, refs, etc.)
  await processForwardLinks(db, allNotesToProcess, {} as DendronConfig);

  if (enableLinkCandidates) {
    await bulkProcessLinkCandidates(db, allNotesToProcess, {} as DendronConfig);
  }

  logger?.info({ ctx, msg: "post:parseAllNoteFilesForSqlite" });
  return ok(null);
}

// Helper Functions

async function addVaultToDb(vault: DVault, db: Database) {
  return VaultsTableUtils.insert(db, {
    name: vault.name ?? vault.fsPath,
    fsPath: vault.fsPath,
  });
}

function getAddedFiles(
  db: Database,
  allFiles: string[],
  vaultId: number
): ResultAsync<string[], SqliteError> {
  if (allFiles.length === 0) {
    return okAsync([]);
  }

  const values = allFiles
    .map((fsPath) => `('${cleanName(path.parse(fsPath).name)}')`)
    .join(",");

  const sql = `
    WITH T(fname) as 
    (VALUES ${values})
    SELECT T.fname
    FROM T
    EXCEPT
    SELECT NoteProps.fname
    FROM NoteProps
	  JOIN VaultNotes ON VaultNotes.noteId = NoteProps.id 
    WHERE vaultId = ${vaultId}
    AND NoteProps.stub = 0
    `;

  const prom = new Promise<string[]>((resolve, reject) => {
    db.all(sql, (err, rows) => {
      if (err) {
        reject(err.message);
      } else {
        resolve(rows.map((row) => row.fname));
      }
    });
  });

  return ResultAsync.fromPromise(prom, (e) => {
    return e as SqliteError;
  });
}

function getUpdatedFiles(
  db: Database,
  allFiles: { fname: string; contentHash: string }[],
  vaultId: number
): ResultAsync<string[], SqliteError> {
  if (allFiles.length === 0) {
    return okAsync([]);
  }

  const values = allFiles
    .map((data) => `('${data.fname}','${data.contentHash}')`)
    .join(",");

  const sql = `
    WITH T(fname, hash) AS
    (VALUES ${values})
    SELECT NoteProps.fname, NoteProps.id FROM T
    JOIN NoteProps ON T.fname = NoteProps.fname AND hash != contentHash
    `;

  const prom = new Promise<any[]>((resolve, reject) => {
    db.all(sql, (err, rows) => {
      if (err) {
        reject(err.message);
      } else {
        resolve(rows);
      }
    });
  });

  return ResultAsync.fromPromise(prom, (e) => {
    return e as SqliteError;
  }).andThen((updatedRows) => {
    if (updatedRows.length === 0) {
      return ResultAsync.fromPromise(Promise.resolve([]), (e) => {
        return e as SqliteError;
      });
    }

    const values = updatedRows
      .map((data) => `('${data.fname}','${data.id}')`)
      .join(",");

    const sql2 = `
      WITH T(fname, id) AS
      (VALUES ${values})
      SELECT T.fname FROM T
      JOIN VaultNotes ON T.Id = VaultNotes.noteId
      WHERE vaultId = ${vaultId}`;

    const prom = new Promise<any[]>((resolve, reject) => {
      db.all(sql2, (err, rows) => {
        if (err) {
          reject(err.message);
        } else {
          resolve(rows.map((row) => row.fname));
        }
      });
    });

    return ResultAsync.fromPromise(prom, (e) => {
      return e as SqliteError;
    });
  });
}

async function processNoteProps(note: NotePropsMeta, db: Database) {
  await NotePropsTableUtils.insert(db, note);
  const vaultIdResp = await VaultsTableUtils.getIdByFsPath(
    db,
    note.vault.fsPath
  );

  if (vaultIdResp.isErr()) {
    return;
  }

  await VaultNotesTableUtils.insert(
    db,
    new VaultNotesTableRow(vaultIdResp.value, note.id)
  );

  if (note.schema) {
    await SchemaNotesTableUtils.insert(db, {
      noteId: note.id,
      moduleId: note.schema.moduleId,
      schemaId: note.schema.schemaId,
    });
  }
}

function processParentLinks(
  db: Database,
  notes: NoteProps[],
  vaultId: number
): ResultAsync<null, SqliteError> {
  const data = notes.map((note) => {
    if (note.fname === "root") {
      return undefined;
    }
    const potentialParentName = note.fname.split(".").slice(0, -1).join(".");

    // If it's a top level domain, then add it as a child of the root node.
    if (potentialParentName === "") {
      return {
        childId: note.id,
        parentFname: "root",
        linkType: "child" as LinkType,
        vaultId,
      };
    } else {
      return {
        childId: note.id,
        parentFname: potentialParentName,
        linkType: "child" as LinkType, // TODO: Remove, no longer necessary
        vaultId,
      };
    }
  });

  if (data.length === 0) {
    return okAsync(null);
  }

  return HierarchyTableUtils.bulkInsertWithParentAsFname(db, _.compact(data));
}

async function processForwardLinks(
  db: Database,
  notes: NoteProps[],
  config: DendronConfig
) {
  return Promise.all(
    notes
      .filter((note) => !note.stub)
      .map((note) => {
        const links = LinkUtils.findLinksFromBody({ note, config });

        const data = links
          .filter(
            (link) =>
              link.type === "ref" ||
              link.type === "frontmatterTag" ||
              link.type === "wiki" ||
              link.type === "md"
          )
          .map((link) => {
            // If the to fname isn't defined, then it can't be processed.
            if (!link.to?.fname) {
              return undefined;
            }
            return {
              source: note.id,
              type: link.type as LinkType,
              sinkFname: link.to.fname,
              sinkVaultName: link.to.vaultName,
              payload: link,
            };
          });

        return LinksTableUtils.bulkInsertLinkWithSinkAsFname(
          db,
          _.compact(data)
        );
      })
  );
}

async function bulkProcessLinkCandidates(
  db: Database,
  notes: NoteProps[],
  config: DendronConfig
) {
  // This method does one INSERT per note:
  return Promise.all(
    notes.map((note) => {
      const content = note.body;

      const remark = MDUtilsV5.procRemarkParse(
        { mode: ProcMode.FULL },
        {
          noteToRender: note,
          fname: note.fname,
          vault: note.vault,
          dest: DendronASTDest.MD_DENDRON,
          config,
        }
      );
      const ast = remark.parse(content) as DendronASTNode;

      const textNodes: Text[] = [];
      visit(
        ast,
        [DendronASTTypes.TEXT],
        (node: Text, _index: number, parent: Parent | undefined) => {
          if (parent?.type === "paragraph" || parent?.type === "tableCell") {
            textNodes.push(node);
          }
        }
      );
      const linkCandidates: DLink[] = [];
      _.map(textNodes, (textNode: Text) => {
        const value = textNode.value as string;

        value.split(/\s+/).map((word) => {
          const startColumn = value.indexOf(word) + 1;
          const endColumn = startColumn + word.length;

          const position: Position = {
            start: {
              line: textNode.position!.start.line,
              column: startColumn,
              offset: textNode.position!.start.offset
                ? textNode.position!.start.offset + startColumn - 1
                : undefined,
            },
            end: {
              line: textNode.position!.start.line,
              column: endColumn,
              offset: textNode.position!.start.offset
                ? textNode.position!.start.offset + endColumn - 1
                : undefined,
            },
          };

          linkCandidates.push({
            type: "linkCandidate",
            from: NoteUtils.toNoteLoc(note),
            value: value.trim(),
            position,
            to: {
              fname: word,
            },
          });
        });
      });

      const data = linkCandidates.map((dlink) => {
        return {
          source: note.id,
          sinkFname: dlink.value,
          type: "linkCandidate" as LinkType,
          payload: dlink,
        };
      });

      return LinksTableUtils.bulkInsertLinkCandidatesWithSinkAsFname(db, data);
    })
  );
}

/**
 * If a stub got replaced by a real note, we need to do several things:
 * 1. Update all stub->children rows in the Hierarchy table with the real note's
 *    ID as the parent. parent->stub replacement doesn't need to be handled
 *    here, because it will get added during bulkProcessParentLinks() later.
 * 2. Delete the stubs from the NoteProps table.
 * @param db
 * @param addedNotes - all notes that are getting added (regardless of whether
 * they replace a stub or not, the checking is done within this function)
 * @param vaultId
 * @returns
 */
function processReplacedStubs(
  db: Database,
  addedNotes: NoteProps[],
  vaultId: number
): ResultAsync<null, SqliteError> {
  if (addedNotes.length === 0) {
    return okAsync(null);
  }

  const values = addedNotes.map((d) => `('${d.fname}', '${d.id}')`).join(",");

  // First, detect which added notes are replacing stubs
  const sql1 = `
    WITH T(fname, id) AS
    (VALUES ${values})
    SELECT NoteProps.id AS stubId, T.id AS newId
    FROM NoteProps
    JOIN T ON T.fname = NoteProps.fname AND NoteProps.stub = 1
    JOIN VaultNotes ON NoteProps.Id = VaultNotes.noteId AND VaultNotes.vaultId = ${vaultId}`;

  const prom = new Promise<{ stubId: string; newId: string }[]>(
    (resolve, reject) => {
      db.all(sql1, (err, rows) => {
        if (err) {
          reject(err.message);
        } else {
          resolve(rows);
        }
      });
    }
  );

  return ResultAsync.fromPromise(prom, (e) => {
    return e as SqliteError;
  }).andThen((replacedStubs) => {
    // If no stubs are being replaced, nothing needs to be done.
    if (replacedStubs.length === 0) {
      return okAsync(null);
    }

    const values = replacedStubs
      .map((d) => `('${d.stubId}', '${d.newId}')`)
      .join(",");

    // Update all stub->children links in the hierarchy table:
    const sql2 = `
      WITH T(oldId, newId) AS
      (VALUES ${values})
      UPDATE Hierarchy
      SET parent = T.newId
      FROM T
      WHERE T.oldId = Hierarchy.parent`;

    return executeSqlWithVoidResult(db, sql2).andThen(() => {
      const values = replacedStubs.map((d) => `('${d.stubId}')`).join(",");

      // Finally, delete any replaced stubs from NoteProps:
      const sql3 = `
        DELETE FROM NoteProps
        WHERE EXISTS
        (
          WITH T(oldId) AS
          (VALUES ${values})
          SELECT T.oldId
          FROM T
          WHERE T.oldId = NoteProps.id
        );`;

      return executeSqlWithVoidResult(db, sql3);
    });
  });
}

/**
 * For any notes that are added, we need to make sure that we also add any stubs
 * necessary at ancestor positions to fill in the hierarchy
 * @param db
 * @param addedNotes
 * @param vaultId
 * @returns an array of NoteProps that contains all stubs that were added.
 */
function addAncestorStubs(
  db: Database,
  addedNotes: NoteProps[],
  vaultId: number
): ResultAsync<NoteProps[], SqliteError> {
  let potentialStubNames: string[] = [];

  addedNotes.forEach((note) => {
    if (note.fname === "root") {
      return;
    }

    const potentialParentNames = note.fname
      .split(".")
      .slice(0, -1)
      .map((_value, index, array) => {
        return array.slice(0, index + 1).join(".");
      });

    potentialStubNames.push(...potentialParentNames);
  });

  if (potentialStubNames.length === 0) {
    return okAsync([]);
  }

  potentialStubNames = _.uniq(potentialStubNames);

  const stubNameValues = potentialStubNames.map((d) => `('${d}')`).join(",");

  // Of all potential stub name values, figure out which ones don't exist as
  // real notes already. The ones that don't exist are the only ones we need to
  // add.
  const sql1 = `
    WITH T(fname) AS
    (VALUES ${stubNameValues})
    SELECT fname
    FROM T
    EXCEPT
    SELECT fname
    FROM VaultNotes
    JOIN NoteProps ON noteId = id
    WHERE vaultId = ${vaultId}`;

  const prom = new Promise<string[]>((resolve, reject) => {
    db.all(sql1, (err, rows) => {
      if (err) {
        reject(err.message);
      } else {
        resolve(rows.map((row) => row.fname));
      }
    });
  });

  return ResultAsync.fromPromise(prom, (e) => {
    return e as SqliteError;
  })
    .andThen((stubsToAdd) => {
      // If all potentialStubNames already exist as real notes (or previously
      // created stubs), nothing needs to be done.
      if (stubsToAdd.length === 0) {
        return okAsync([]);
      }

      // Generate a random ID for any stubs that need to be added
      const stubProps = stubsToAdd.map((fname) => {
        return { fname, id: genUUID() };
      });

      const stubInsertionValues = stubProps
        .map(
          (d) => `('${d.id}', '${d.fname}', '${NoteUtils.genTitle(d.fname)}')`
        )
        .join(",");

      // Now do the insertion into NoteProps, with stub set to 1 (true)
      const sql2 = `
        INSERT INTO NoteProps (id, fname, title, stub)
        WITH T(id, fname, title) AS
        (VALUES ${stubInsertionValues})
        SELECT T.id, T.fname, T.title, 1 FROM T -- 1 here means stub = true`;

      return executeSqlWithVoidResult(db, sql2).map(() => stubProps);
    })
    .andThen((stubProps) => {
      if (stubProps.length === 0) {
        return okAsync([]);
      }

      // We also need to add stub notes into VaultNotes:
      return VaultNotesTableUtils.bulkInsert(
        db,
        stubProps.map((prop) => {
          return { vaultId, noteId: prop.id };
        })
      ).map(() => {
        return stubProps.map((fname) => {
          return {
            ...fname,
            title: "",
            desc: "",
            created: Time.now().toMillis(),
            updated: Time.now().toMillis(),
            stub: true,
          } as NoteProps;
        });
      });
    });
}

/**
 * For all updated notes that had an ID change, delete the entries in the db
 * associated with the old ID.
 * @param db
 * @param updatedNotes
 * @param vaultId
 * @returns
 */
function purgeDBForUpdatedNotesWithChangedNoteId(
  db: Database,
  updatedNotes: NotePropsMeta[],
  vaultId: number
): ResultAsync<null, SqliteError> {
  const values = updatedNotes
    .map((props) => `('${props.fname}','${props.id}')`)
    .join(",");

  const sql = `
    DELETE FROM NoteProps AS Outer
    WHERE EXISTS
    (
      WITH T(fname, id) AS
      (VALUES ${values})
      SELECT T.fname, T.id AS UpdatedId, NoteProps.id
      FROM T
      JOIN NoteProps ON T.fname = NoteProps.fname
      JOIN VaultNotes ON NoteProps.Id = VaultNotes.noteId
      WHERE vaultId = ${vaultId}
      AND T.id != NoteProps.id
      AND Outer.id = NoteProps.id
    )`;

  return executeSqlWithVoidResult(db, sql);
}

/**
 * If any links pointed to a note that changed ID's, those links need to be
 * updated.
 * @param db
 * @param updatedNotes
 * @param vaultId
 * @returns
 */
function updateLinksForChangedNoteId(
  db: Database,
  updatedNotes: NotePropsMeta[],
  vaultId: number
): ResultAsync<null, SqliteError> {
  const values = updatedNotes
    .map((props) => `('${props.fname}','${props.id}')`)
    .join(",");

  const sql = `
  UPDATE Links
  SET sink = UpdatedIds.newId
  FROM 
  (
    WITH T(fname, id) AS
      (VALUES ${values})
      SELECT T.id AS newId, NoteProps.id AS oldId
      FROM T
      JOIN NoteProps ON T.fname = NoteProps.fname
      JOIN VaultNotes ON NoteProps.Id = VaultNotes.noteId
      WHERE vaultId = ${vaultId}
      AND T.id != NoteProps.id
  ) AS UpdatedIds
  WHERE Links.sink = UpdatedIds.oldId`;

  return executeSqlWithVoidResult(db, sql);
}

function deleteRemovedFilesFromDB(
  db: Database,
  remainingFiles: string[],
  vaultId: number
): ResultAsync<null, SqliteError> {
  let sql;

  if (remainingFiles.length === 0) {
    sql = `
    DELETE FROM NoteProps AS Outer
    WHERE EXISTS
    (
      SELECT NoteProps.id
      FROM NoteProps
      JOIN VaultNotes ON NoteProps.id = VaultNotes.noteId
      WHERE VaultId = ${vaultId}
      AND Outer.id = NoteProps.id
    )`;

    return executeSqlWithVoidResult(db, sql);
  } else {
    const values = remainingFiles.map((fname) => `('${fname}')`).join(",");

    // NOTE: When doing this table-diffing kind of operation on a VALUES list,
    // EXCEPT is much much faster than doing a LEFT OUTER JOIN (50ms vs 15 seconds
    // on 15,000 values) in SQLite
    sql = `
      DELETE FROM NoteProps AS Outer
      WHERE EXISTS
      (
        WITH T(fname) as 
        (VALUES ${values})
        SELECT NoteProps.id
        FROM 
        (SELECT fname
        FROM NoteProps
        EXCEPT
        SELECT fname
        FROM T) AS A
        JOIN NoteProps ON A.fname = NoteProps.fname
        JOIN VaultNotes ON NoteProps.id = VaultNotes.noteId
        WHERE VaultId = ${vaultId}
        AND (NoteProps.stub != 1)
        AND Outer.id = NoteProps.id
      )`;
  }

  return executeSqlWithVoidResult(db, sql);
}

function deleteLinksForUpdatedNotes(
  db: Database,
  updatedNoteFnames: string[],
  vaultId: number
): ResultAsync<null, SqliteError> {
  const values = updatedNoteFnames.map((fname) => `('${fname}')`).join(",");

  const sql = `
    DELETE FROM Links AS Outer
    WHERE EXISTS
    (
      WITH T(fname) as 
      (VALUES ${values})
      SELECT Links.source, NoteProps.fname, VaultNotes.vaultId, Links.linkType
      FROM T
      JOIN NoteProps ON NoteProps.fname = T.fname
      JOIN Links ON NoteProps.Id = Links.source
      JOIN VaultNotes ON NoteProps.Id = VaultNotes.noteId
      WHERE VaultId = ${vaultId}
      AND Links.source = Outer.source
    )`;
  return executeSqlWithVoidResult(db, sql);
}
