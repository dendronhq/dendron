import { Database } from "sqlite3";
import { SqliteMetadataStore } from "./SqliteMetadataStore";
import { LinksTableUtils } from "./tables/LinksTable";
import { NotePropsTableUtils } from "./tables/NotePropsTable";
import { VaultNotesTableUtils } from "./tables/VaultNotesTable";
import { VaultsTableUtils } from "./tables/VaultsTable";

export class SqliteFactory {
  public async init() {
    const _db = new Database("dendron.test3.db");

    // Create the relation-less tables first (vaults and NoteProps);
    await VaultsTableUtils.createTable(_db);
    await NotePropsTableUtils.createTable(_db);

    // Now create tables with relations
    await LinksTableUtils.createTable(_db);
    await VaultNotesTableUtils.createTable(_db);

    return _db;
  }

  static async createIndices(db: Database) {
    db.run(
      `CREATE INDEX IF NOT EXISTS idx_NoteProps_fname
    ON NoteProps (fname);`,
      (err) => {
        if (!err) {
          resolve();
        }
      }
    );
  }

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

    return new SqliteMetadataStore(db);
  }
}
