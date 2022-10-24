import {
  cleanName,
  DendronConfig,
  DVault,
  NoteProps,
  NotePropsMeta,
  string2Note,
} from "@dendronhq/common-all";
import { LinkUtils } from "@dendronhq/unified";
import fs from "fs-extra";
import path from "path";
import { Database } from "sqlite3";
import {
  VaultNotesTableRow,
  VaultNotesTableUtils,
  VaultsTableUtils,
} from "../sqlite";
import { LinksTableUtils } from "../sqlite/tables/LinksTable";
import { NotePropsTableUtils } from "../sqlite/tables/NotePropsTable";

// This really should be called NoteMetadataStoreInitializer
// export function parseFiles(
//   uri: URI,
//   metadataStore: IDataStore<string, NotePropsMeta>
// ) {}

// async function tempReadFile {
//   const content = fs.readFileSync(fpath, { encoding: "utf8" });
//   const { name } = path.parse(fpath);
//   const sig = genHash(content);
//   const cacheEntry = this.cache.get(name);
//   const matchHash = cacheEntry?.hash === sig;
//   let note: NoteProps;

// This needs to do one vault at a time.
export async function parseAllNoteFiles(
  files: string[],
  // files: URI[],
  vault: DVault,
  db: Database,
  root: string // TODO: Remove, base this on vault fsPath
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

  // TODO: Bulk Insert
  await Promise.all(
    allNotes.map((note) => {
      return processNoteProps(note, db);
    })
  );

  await Promise.all(
    allNotes.map((note) => {
      processLinks(note, db, {} as DendronConfig);
    })
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

  const vaultId = await VaultsTableUtils.getIdByFsPath(db, note.vault.fsPath);
  await VaultNotesTableUtils.insert(
    db,
    new VaultNotesTableRow(vaultId as number, note.id)
  ); // TODO: Remove cast
}

async function processLinks(
  note: NoteProps,
  db: Database,
  config: DendronConfig
) {
  // Add Children to Links Table
  // TODO: Bulk insert

  const potentialParentName = note.fname.split(".").slice(0, -1).join(".");

  // Insert the parent relationship for the individual note. If the parent
  // doesn't exist, that's ok, we can fail silently.
  await LinksTableUtils.insertLinkWithSourceAsFname(
    db,
    note.id,
    potentialParentName,
    "child",
    undefined
  );

  const links = LinkUtils.findLinksFromBody({ note, config });
  // Add Forward Links
  await Promise.all(
    links.map((link) => {
      if (
        link.type === "ref" ||
        link.type === "frontmatterTag" ||
        link.type === "wiki" ||
        link.type === "md"
      ) {
        return LinksTableUtils.insertLinkWithSinkAsFname(
          db,
          note.id,
          link.to!.fname!, // TODO - don't run if null
          link.type,
          link
        );
      }
    })
  );
}
