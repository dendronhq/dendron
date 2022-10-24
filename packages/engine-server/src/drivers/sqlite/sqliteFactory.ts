import { Database } from "sqlite3";
import { LinksTableUtils } from "./tables/LinksTable";
import { NotePropsTableUtils } from "./tables/NotePropsTable";
import { VaultNotesTableUtils } from "./tables/VaultNotesTable";
import { VaultsTableUtils } from "./tables/VaultsTable";

export class SqliteFactory {
  public async init() {
    const _db = new Database("dendron.test.db");

    // Create the relation-less tables first (vaults and NoteProps);
    await VaultsTableUtils.createTable(_db);
    await NotePropsTableUtils.createTable(_db);

    // Now create tables with relations
    await LinksTableUtils.createTable(_db);
    await VaultNotesTableUtils.createTable(_db);

    return _db;
  }
}
