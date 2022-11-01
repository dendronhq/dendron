import {
  cleanName,
  DendronConfig,
  DVault,
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
import path from "path";
import { Database } from "sqlite3";
import {
  VaultNotesTableRow,
  VaultNotesTableUtils,
  VaultsTableUtils,
} from "../sqlite";
import { LinksTableUtils, LinkType } from "../sqlite/tables/LinksTable";
import { NotePropsTableUtils } from "../sqlite/tables/NotePropsTable";
import { SchemaNotesTableUtils } from "../sqlite/tables/SchemaNotesTable";

// This really should be called SQliteNoteMetadataStoreInitializer

// This needs to do one vault at a time.
export async function parseAllNoteFiles(
  files: string[],
  vault: DVault,
  db: Database,
  root: string, // TODO: Remove, base this on vault fsPath
  schemas: SchemaModuleDict
) {
  await addVaultToDb(vault, db);

  const allNotes = await Promise.all(
    files.map(async (file) => {
      const content = await fs.readFile(path.join(root, file), {
        encoding: "utf8",
      });
      const { name } = path.parse(file);
      return content2Note({ content, fname: name, vault });

      // TODO: Add hashing optimization back later
      // const { name } = path.parse(file.fsPath);
      // const sig = genHash(content);
      // const cacheEntry = this.cache.get(name);
      // const matchHash = cacheEntry?.hash === sig;
      // let note: NoteProps;
    })
  );

  // Schemas:
  const dicts = NoteDictsUtils.createNoteDicts(allNotes);
  const domains = allNotes.filter((note) => !note.fname.includes("."));

  domains.map((domain) => {
    SchemaUtils.matchDomain(domain, dicts.notesById, schemas);
  });

  const one = process.hrtime();
  // TODO: Bulk Insert
  await Promise.all(
    Object.values(dicts.notesById).map((note) => {
      return processNoteProps(note, db);
    })
  );

  const two = process.hrtime();
  console.log(
    `Duration for ProcessNoteProps: ${getDurationMilliseconds(one)} ms`
  );

  await bulkProcessParentLinks(db, allNotes);
  await bulkProcessOtherLinks(db, allNotes, {} as DendronConfig);

  console.log(`Duration for ProcessLinks: ${getDurationMilliseconds(two)} ms`);
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
