import {
  cleanName,
  DendronASTDest,
  DendronConfig,
  DLink,
  DVault,
  genHash,
  NoteDictsUtils,
  NoteProps,
  NotePropsMeta,
  NoteUtils,
  Position,
  SchemaModuleDict,
  SchemaUtils,
  string2Note,
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

// This needs to do one vault at a time.
export async function parseAllNoteFilesForSqlite(
  files: string[],
  vault: DVault,
  db: Database,
  root: string,
  schemas: SchemaModuleDict,
  enableLinkCandidates: boolean = false
): Promise<Result<null, any>> {
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

  // Compute Added Files
  const addedFileResp = await getAddedFiles(db, files, vaultId);

  if (addedFileResp.isErr()) {
    return err(addedFileResp.error);
  }

  const addedNotes: NoteProps[] = addedFileResp.value.map((fname) => {
    const content = contentDictionary[fname];

    const props = string2Note({ content, fname: cleanName(fname), vault });
    props.contentHash = genHash(content);

    return props;
  });

  // Compute Updated Notes
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

  // Handle deleted notes:
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

  // TODO: Bulk Insert
  await Promise.all(
    allNotesToProcess.map((note) => {
      return processNoteProps(note, db);
    })
  );

  // We need to do additional processing on updated links if any of them have
  // had their ID's changed.
  if (updatedNotes.length > 0) {
    // This step must be done AFTER the updated notes have been added, or else the foreign key constraint on the Links table will fail.
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
  if (addedNotes.length > 0 && vault.name) {
    const updateUnresolvedLinksForAddedNotesResult =
      await LinksTableUtils.updateUnresolvedLinksForAddedNotes(
        db,
        addedNotes,
        vault.name
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
  }

  const bulkProcessParentLinksResult = await bulkProcessParentLinks(
    db,
    allNotesToProcess,
    vaultId
  );

  if (bulkProcessParentLinksResult.isErr()) {
    return err(bulkProcessParentLinksResult.error);
  }

  await bulkProcessOtherLinks(db, allNotesToProcess, {} as DendronConfig);

  if (enableLinkCandidates) {
    await bulkProcessLinkCandidates(db, allNotesToProcess, {} as DendronConfig);
  }

  return ok(null);
}

async function addVaultToDb(vault: DVault, db: Database) {
  return VaultsTableUtils.insert(db, {
    name: vault.name ?? "vault",
    fsPath: vault.fsPath,
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

function bulkProcessParentLinks(
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
        linkType: "child" as LinkType,
        vaultId,
      };
    }
  });

  if (data.length === 0) {
    return okAsync(null);
  }

  return HierarchyTableUtils.bulkInsertWithParentAsFname(db, _.compact(data));
}

async function bulkProcessOtherLinks(
  db: Database,
  notes: NoteProps[],
  config: DendronConfig
) {
  // This method does one INSERT per note:
  return Promise.all(
    notes.map((note) => {
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

      return LinksTableUtils.bulkInsertLinkWithSinkAsFname(db, _.compact(data));
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

function deleteRemovedFilesFromDB(
  db: Database,
  remainingFiles: string[],
  vaultId: number
): ResultAsync<null, SqliteError> {
  const values = remainingFiles.map((fname) => `('${fname}')`).join(",");

  // TODO: What if all values are deleted?

  // NOTE: When doing this table-diffing kind of operation on a VALUES list,
  // EXCEPT is much much faster than doing a LEFT OUTER JOIN (50ms vs 15 seconds
  // on 15,000 values) in SQLite
  const sql = `
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
      AND Outer.id = NoteProps.id
    )`;

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

function getAddedFiles(
  db: Database,
  allFiles: string[],
  vaultId: number
): ResultAsync<string[], SqliteError> {
  const values = allFiles
    .map((fsPath) => `('${cleanName(path.parse(fsPath).name)}')`)
    .join(",");

  const sql = `
  WITH T(fname) as 
  (VALUES ${values})
  SELECT T.fname
  FROM T
  LEFT OUTER JOIN NoteProps ON T.fname = NoteProps.fname 
  LEFT OUTER JOIN VaultNotes ON VaultNotes.noteId = NoteProps.id 
  WHERE NoteProps.fname IS NULL OR (NoteProps.fname IS NOT NULL AND vaultId != ${vaultId})
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

function getUpdatedFiles(
  db: Database,
  allFiles: { fname: string; contentHash: string }[],
  vaultId: number
): ResultAsync<string[], SqliteError> {
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
