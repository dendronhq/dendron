import { DVault, IFileStore } from "@dendronhq/common-all";
import { Database } from "sqlite3";
import { parseAllNoteFiles } from "../file";
import { SqliteMetadataStore } from "./SqliteMetadataStore";
import { LinksTableUtils } from "./tables/LinksTable";
import { NotePropsTableUtils } from "./tables/NotePropsTable";
import { SchemaNotesTableUtils } from "./tables/SchemaNotesTable";
import { VaultNotesTableUtils } from "./tables/VaultNotesTable";
import { VaultsTableUtils } from "./tables/VaultsTable";
import { URI } from "vscode-uri";
import { vault2Path } from "@dendronhq/common-server";

export class SqliteFactory {
  public static async init(
    wsRoot: string,
    vaults: DVault[],
    fileStore: IFileStore,
    dbname?: string
  ) {
    const _db = await new Promise<Database>((resolve) => {
      const db = new Database(dbname ?? "dendron.test3.db", (err) => {
        if (err) {
          debugger;
          console.log(err);
        }

        resolve(db);
      });
    });

    // Create the relation-less tables first (vaults and NoteProps);
    await VaultsTableUtils.createTable(_db);
    await NotePropsTableUtils.createTable(_db);

    // Now create tables with relations
    await LinksTableUtils.createTable(_db);
    await VaultNotesTableUtils.createTable(_db);
    await SchemaNotesTableUtils.createTable(_db);

    // await Promise.all(
    //   vaults.map((vault) => {
    //     return VaultsTableUtils.insert(_db, {
    //       name: vault.name ?? "vault",
    //       fsPath: vault.fsPath,
    //     });
    //   })
    // );

    await Promise.all(
      vaults.map(async (vault) => {
        const vpath = vault2Path({ vault, wsRoot });
        // Get list of files from filesystem
        const maybeFiles = await fileStore.readDir({
          root: URI.parse(vpath),
          include: ["*.md"],
        });

        if (maybeFiles.error) {
          //
        }

        // TODO: Add in schemaModuleDict
        return parseAllNoteFiles(maybeFiles.data!, vault, _db, vpath, {});
      })
    );

    await new Promise<void>((resolve) => {
      _db.run("PRAGMA foreign_keys = ON", (err) => {
        if (!err) {
          resolve();
        }
      });
    });

    return _db;
  }

  // static async createIndices(db: Database) {
  //   db.run(
  //     `CREATE INDEX IF NOT EXISTS idx_NoteProps_fname
  //   ON NoteProps (fname);`,
  //     (err) => {
  //       if (!err) {
  //         resolve();
  //       }
  //     }
  //   );
  // }

  static initSync() {
    const _db = new Database("dendron.test3.db");

    // Create the relation-less tables first (vaults and NoteProps);
    VaultsTableUtils.createTable(_db);
    NotePropsTableUtils.createTable(_db);

    // Now create tables with relations
    LinksTableUtils.createTable(_db);
    VaultNotesTableUtils.createTable(_db);

    return _db;
  }

  static createMetadataStore(): SqliteMetadataStore {
    const db = SqliteFactory.initSync();

    return new SqliteMetadataStore(db, []);
  }

  static async createMetadataStoreForTest(
    vaults: DVault[],
    store: IFileStore,
    wsRoot: string
  ): Promise<SqliteMetadataStore> {
    const db = await SqliteFactory.init(wsRoot, vaults, store, ":memory:");

    // await Promise.all(
    //   vaults.map((vault) => {
    //     return VaultsTableUtils.insert(db, {
    //       name: vault.name ?? "vault",
    //       fsPath: vault.fsPath,
    //     });
    //   })
    // );

    return new SqliteMetadataStore(db, vaults);
  }
}
