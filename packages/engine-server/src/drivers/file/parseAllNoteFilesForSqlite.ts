import {
  cleanName,
  DendronConfig,
  DVault,
  genHash,
  NoteDictsUtils,
  NoteProps,
  NotePropsMeta,
  SchemaModuleDict,
  SchemaUtils,
  string2Note,
} from "@dendronhq/common-all";
import { getDurationMilliseconds } from "@dendronhq/common-server";
import { LinkUtils } from "@dendronhq/unified";
import fs from "fs-extra";
import _ from "lodash";
import { err, ok, Result, ResultAsync } from "neverthrow";
import path from "path";
import { Database } from "sqlite3";
import {
  executeSqlWithVoidResult,
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
  schemas: SchemaModuleDict
): Promise<Result<null, any>> {
  await addVaultToDb(vault, db);

  const vaultIdResp = await VaultsTableUtils.getIdByFsPath(db, vault.fsPath);

  let vaultId: number;

  if (vaultIdResp.isOk()) {
    vaultId = vaultIdResp.value;
  } else {
    return err(vaultIdResp.error);
  }

  const uno = process.hrtime();

  // Get the content from all files and calculate their hashes
  const fileStateData = files.map((file) => {
    const content = fs.readFileSync(path.join(root, file), {
      encoding: "utf8",
    });
    const { name } = path.parse(file);

    return { fname: cleanName(name), contentHash: genHash(content), content };
  });

  const durationOne = getDurationMilliseconds(uno);

  console.log(`Duration Reading Files: ${durationOne} ms`);

  const contentDictionary: { [key: string]: string } = {};
  for (const data of fileStateData) {
    contentDictionary[data.fname] = data.content;
  }
  // Compute Added Files
  const prio = process.hrtime();
  const addedFileResp = await getAddedFiles(db, files, vaultId);

  console.log(
    `Duration Finding Added Files via DB: ${getDurationMilliseconds(prio)} ms`
  );

  if (addedFileResp.isErr()) {
    return err(addedFileResp.error);
  }

  const addedNotes: NoteProps[] = addedFileResp.value.map((fname) => {
    const content = contentDictionary[fname];

    const props = content2Note({ content, fname, vault });
    props.contentHash = genHash(content);

    return props;
  });

  // Compute Updated Notes
  const dos = process.hrtime();

  const getUpdatedFilesResp = await getUpdatedFiles(db, fileStateData, vaultId);

  console.log(
    `Duration getUpdatedFiles in DB: ${getDurationMilliseconds(dos)} ms`
  );

  if (getUpdatedFilesResp.isErr()) {
    return err(getUpdatedFilesResp.error);
  }

  const abc = process.hrtime();
  const updatedNotes: NoteProps[] = getUpdatedFilesResp.value.map((fname) => {
    const content = contentDictionary[fname];

    const props = content2Note({ content, fname, vault });
    props.contentHash = genHash(content);

    return props;
  });

  console.log(
    `Duration mapping updatedNotes to NoteProps : ${getDurationMilliseconds(
      abc
    )} ms`
  );

  const def = process.hrtime();
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

  console.log(
    `Duration deleteLinksForUpdatedNotes in DB : ${getDurationMilliseconds(
      def
    )} ms`
  );

  const hijk = process.hrtime();
  // Handle deleted notes:
  const deleteRes = await deleteRemovedFilesFromDB(
    db,
    Object.keys(contentDictionary),
    vaultId
  );

  console.log(
    `Duration deleteRemovedFilesFromDB in DB : ${getDurationMilliseconds(
      hijk
    )} ms`
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

  const one = process.hrtime();
  // TODO: Bulk Insert
  await Promise.all(
    allNotesToProcess.map((note) => {
      return processNoteProps(note, db);
    })
  );

  const two = process.hrtime();
  console.log(
    `Duration for ProcessNoteProps: ${getDurationMilliseconds(one)} ms`
  );

  // We need to do additional processing on updated links if any of them have had their ID's changed.
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

    // If any updated notes had an ID change, then we also need to delete any references to the old ID in NoteProps, Parent-child links and VaultNotes:
    const purgeChangedIdsResult = await purgeDBForUpdatedNotesWithChangedNoteId(
      db,
      updatedNotes,
      vaultId
    );
    if (purgeChangedIdsResult.isErr()) {
      return err(purgeChangedIdsResult.error);
    }
  }

  const bulkProcessParentLinksResult = await bulkProcessParentLinks(
    db,
    allNotesToProcess
  );

  if (bulkProcessParentLinksResult.isErr()) {
    return err(bulkProcessParentLinksResult.error);
  }

  await bulkProcessOtherLinks(db, allNotesToProcess, {} as DendronConfig);

  console.log(`Duration for ProcessLinks: ${getDurationMilliseconds(two)} ms`);

  console.log(
    `New Notes: ${addedNotes.length}. Updated Notes: ${updatedNotes.length}`
  );

  return ok(null);
}

// TODO: Probably move this out of note parser
async function addVaultToDb(vault: DVault, db: Database) {
  return VaultsTableUtils.insert(db, {
    name: vault.name ?? "vault",
    fsPath: vault.fsPath,
  });
}

/**
 * Given a fpath, attempt to convert raw file contents into a NoteProp
 *
 * Look up metadata from cache. If contenthash hasn't changed, use metadata from cache.
 * Otherwise, reconstruct metadata from scratch
 *
 * @returns NoteProp associated with fpath
 */
function content2Note({
  content,
  fname,
  vault,
}: {
  content: any;
  fname: string;
  vault: DVault;
}): NoteProps {
  // If hash is different, then we update all links and anchors ^link-anchor
  const note = string2Note({ content, fname: cleanName(fname), vault });
  return note;
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
  notes: NoteProps[]
): ResultAsync<void, SqliteError> {
  const data = notes.map((note) => {
    if (note.fname === "root") {
      return undefined;
    }
    const potentialParentName = note.fname.split(".").slice(0, -1).join(".");

    // If it's a top level domain, then add it as a child of the root node.
    if (potentialParentName === "") {
      return {
        sinkId: note.id,
        sourceFname: "root",
        linkType: "child" as LinkType,
      };
    } else {
      return {
        sinkId: note.id,
        sourceFname: potentialParentName,
        linkType: "child" as LinkType,
      };
    }
  });

  return LinksTableUtils.bulkInsertLinkWithSourceAsFname(db, _.compact(data));
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
          return {
            sourceId: note.id,
            sinkFname: link.to!.fname!, // TODO: Doesn't work.
            linkType: link.type as LinkType,
            payload: link,
          };
        });

      return LinksTableUtils.bulkInsertLinkWithSinkAsFname(db, data);
    })
  );
}

function deleteRemovedFilesFromDB(
  db: Database,
  remainingFiles: string[],
  vaultId: number
): ResultAsync<void, SqliteError> {
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
): ResultAsync<void, SqliteError> {
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
  WHERE Links.linkType != 1 -- Not Parent-Children Links
  AND VaultId = ${vaultId}
  AND Links.source = Outer.source
)
  `;
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
): ResultAsync<void, SqliteError> {
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
): ResultAsync<void, SqliteError> {
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

  // const sql = `
  // WITH T(fname, hash) AS
  // (VALUES ${values})
  // SELECT NoteProps.fname FROM T
  // JOIN NoteProps ON T.fname = NoteProps.fname
  // JOIN VaultNotes ON NoteProps.Id = VaultNotes.noteId
  // WHERE hash != contentHash
  // AND vaultId = ${vaultId}
  // `;

  // const sql = `
  // SELECT fname
  // FROM
  // (
  // WITH T(fname, hash) AS
  // (VALUES ${values})
  // SELECT NoteProps.fname, NoteProps.Id FROM T
  // JOIN NoteProps ON T.fname = NoteProps.fname AND hash != contentHash
  // ) AS first
  // JOIN VaultNotes ON first.Id = VaultNotes.noteId
  // WHERE vaultId = ${vaultId}
  // `;

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
  WHERE vaultId = ${vaultId}
  `;

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
