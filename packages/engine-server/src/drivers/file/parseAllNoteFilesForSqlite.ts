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
import { ResultAsync } from "neverthrow";
import path from "path";
import { Database } from "sqlite3";
import {
  executeSqlWithVoidResult,
  VaultNotesTableRow,
  VaultNotesTableUtils,
  VaultsTableUtils,
} from "../sqlite";
import { SqliteError } from "../sqlite/SqliteError";
import { LinksTableUtils, LinkType } from "../sqlite/tables/LinksTable";
import { NotePropsTableUtils } from "../sqlite/tables/NotePropsTable";
import { SchemaNotesTableUtils } from "../sqlite/tables/SchemaNotesTable";

// This needs to do one vault at a time.
export async function parseAllNoteFilesForSqlite(
  files: string[],
  vault: DVault,
  db: Database,
  root: string, // TODO: Remove, base this on vault fsPath
  schemas: SchemaModuleDict
) {
  await addVaultToDb(vault, db);

  const vaultIdResp = await VaultsTableUtils.getIdByFsPath(db, vault.fsPath);

  let vaultId: number;

  if (vaultIdResp.isOk()) {
    vaultId = vaultIdResp.value;
  } else {
    return; // TODO: Throw
  }

  // TODO: Handle Deleted Notes

  // const deletedFiles = ;
  const addedFileResp = await getAddedFiles(db, files, vaultId);

  if (addedFileResp.isErr()) {
    return; // TODO: Throw
  }

  // const addedNotes = await Promise.all(
  //   addedFileResp.value.map(async (file) => {
  //     const content = await fs.readFile(path.join(root, file), {
  //       encoding: "utf8",
  //     });

  //     const { name } = path.parse(file);

  //     const props = content2Note({ content, fname: name, vault });
  //     props.contentHash = genHash(content);

  //     return props;
  //   })
  // );

  // const updatedNotes = _.compact(
  //   await Promise.all(
  //     files.map(async (file) => {
  //       const content = await fs.readFile(path.join(root, file), {
  //         encoding: "utf8",
  //       });

  //       const sig = genHash(content);
  //       const { name } = path.parse(file);

  //       const getHashResp = await NotePropsTableUtils.getHashByFnameAndVaultId(
  //         db,
  //         name,
  //         vaultId
  //       );

  //       if (getHashResp.isOk() && getHashResp.value === sig) {
  //         return undefined;
  //       }

  //       return content2Note({ content, fname: name, vault });
  //     })
  //   )
  // );

  const addedNotes: NoteProps[] = [];
  const updatedNotes: NoteProps[] = [];

  const uno = process.hrtime();

  const timingData = await Promise.all(
    files.map(async (file) => {
      const one = process.hrtime();

      const content = fs.readFileSync(path.join(root, file), {
        encoding: "utf8",
      });

      const durationOne = getDurationMilliseconds(one);
      const two = process.hrtime();

      const sig = genHash(content);
      const { name } = path.parse(file);

      const getHashResp = await NotePropsTableUtils.getHashByFnameAndVaultId(
        db,
        cleanName(name),
        vaultId
      );

      const durationTwo = getDurationMilliseconds(two);
      const three = process.hrtime();

      if (getHashResp.isErr()) {
        return; // TODO: report error
      }

      if (getHashResp.value === null) {
        const props = content2Note({ content, fname: name, vault });
        props.contentHash = sig;
        addedNotes.push(props);
      } else if (getHashResp.value !== sig) {
        const props = content2Note({ content, fname: name, vault });
        props.contentHash = sig;
        updatedNotes.push(props);
      }

      const durationThree = getDurationMilliseconds(three);

      return {
        durationOne,
        durationTwo,
        durationThree,
      };
    })
  );
  console.log(`Total Data Points: ${timingData.length}`);
  console.log(
    `Duration One Mean: ${_.mean(timingData.map((data) => data?.durationOne))}`
  );
  console.log(
    `Duration Two Mean: ${_.mean(timingData.map((data) => data?.durationTwo))}`
  );
  console.log(
    `Duration Three Mean: ${_.mean(
      timingData.map((data) => data?.durationThree)
    )}`
  );

  debugger;

  console.log(
    `Duration for Figuring out New/Updated Notes: ${getDurationMilliseconds(
      uno
    )} ms`
  );

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

  await bulkProcessParentLinks(db, allNotesToProcess);
  await bulkProcessOtherLinks(db, allNotesToProcess, {} as DendronConfig);

  console.log(`Duration for ProcessLinks: ${getDurationMilliseconds(two)} ms`);

  console.log(
    `New Notes: ${addedNotes.length}. Updated Notes: ${updatedNotes.length}`
  );
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

async function bulkProcessParentLinks(db: Database, notes: NoteProps[]) {
  const data = notes.map((note) => {
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

  await LinksTableUtils.bulkInsertLinkWithSourceAsFname(db, data);
}

async function bulkProcessOtherLinks(
  db: Database,
  notes: NoteProps[],
  config: DendronConfig
) {
  // This method does one INSERT per note:
  return Promise.all(
    notes.map((note) => {
      // const allLinks: DLink[] = [];
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
            sinkFname: link.to!.fname!,
            linkType: link.type as LinkType,
            payload: link,
          };
        });

      return LinksTableUtils.bulkInsertLinkWithSinkAsFname(db, data);
    })
  );

  // This way does only 1 INSERT call:
  // const dataArray: any[] = [];

  // notes.map((note) => {
  //   const links = LinkUtils.findLinksFromBody({ note, config });

  //   const data = links
  //     .filter(
  //       (link) =>
  //         link.type === "ref" ||
  //         link.type === "frontmatterTag" ||
  //         link.type === "wiki" ||
  //         link.type === "md"
  //     )
  //     .map((link) => {
  //       return {
  //         sourceId: note.id,
  //         sinkFname: link.to!.fname!,
  //         linkType: link.type as LinkType,
  //         payload: link,
  //       };
  //     });

  //   dataArray.push(...data);
  // });

  // return LinksTableUtils.bulkInsertLinkWithSinkAsFname(db, dataArray);
}

function deleteRemovedFilesFromDB(
  db: Database,
  remainingFiles: string[],
  vaultId: number
): ResultAsync<void, SqliteError> {
  const values = remainingFiles.map((fname) => `('${fname}')`).join(",");

  // TODO: What if all values are deleted?

  const sql = `
DELETE FROM NoteProps AS Outer
WHERE EXISTS
(
  WITH T(fname) as 
  (VALUES ${values})
  SELECT NoteProps.id
  FROM VaultNotes
  JOIN NoteProps ON VaultNotes.noteId = NoteProps.id
  LEFT OUTER JOIN T on NoteProps.fname = T.fname
  WHERE T.fname IS NULL
  AND VaultId = ${vaultId}
  AND Outer.id = NoteProps.id
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
    .map((fsPath) => `('${path.parse(fsPath).name}','${fsPath}')`)
    .join(",");

  const sql = `
  WITH T(fname, fullPath) as 
  (VALUES ${values})
  SELECT T.fullPath
  FROM T
  LEFT OUTER JOIN NoteProps ON T.fname = NoteProps.fname
  LEFT OUTER JOIN VaultNotes ON VaultNotes.noteId = NoteProps.id
  WHERE NoteProps.fname IS NULL OR vaultId != ${vaultId}
  `;

  const prom = new Promise<string[]>((resolve, reject) => {
    db.all(sql, (err, rows) => {
      if (err) {
        reject(err.message);
      } else {
        resolve(rows.map((row) => row.fullPath));
      }
    });
  });

  return ResultAsync.fromPromise(prom, (e) => {
    return e as SqliteError;
  });
}
