import {
  asyncLoopOneAtATime,
  DVault,
  NotePropsByIdDict,
  VaultUtils,
} from "@dendronhq/common-all";
import _ from "lodash";
import { PrismaClient } from "../generated-prisma-client";
import fs from "fs-extra";

let _prisma: PrismaClient | undefined;

function getPrismaClient(): PrismaClient {
  if (_prisma === undefined) {
    throw Error("prisma client not initialized");
  }
  return _prisma;
}

export type NoteIndexLightProps = {
  fname: string;
  id: string;
};

export class SQLiteMetadataStore {
  constructor({ wsRoot }: { wsRoot: string }) {
    if (_prisma) {
      throw new Error(
        "SQLiteMetadataStore constructor should only be called once"
      );
    }
    // "DATABASE_URL="file://Users/kevinlin/code/dendron/local/notes.db"""
    _prisma = new PrismaClient({
      datasources: {
        db: {
          url: `file://${wsRoot}/metadata.db`,
        },
      },
    });
  }

  static async isDBInitialized() {
    const query = `SELECT name FROM sqlite_master WHERE type='table' AND name='notes'`;
    const resp = (await getPrismaClient().$queryRawUnsafe(query)) as {
      name: string;
    }[];
    return resp.length === 1;
  }

  static async isVaultInitialized(vault: DVault): Promise<boolean> {
    // valid result: [ { name: "notes", }, ]
    const resp = await getPrismaClient().vaultMetadata.findFirst({
      where: { relativePath: vault.fsPath },
    });
    return resp !== null;
  }

  static async createAllTables() {
    const queries = `CREATE TABLE IF NOT EXISTS "notes" (
			"fname" TEXT,
			"id" TEXT NOT NULL PRIMARY KEY,
			"title" TEXT,
			"vault" TEXT,
			"stub" BIGINT
	, updated INTEGER);
  CREATE TABLE IF NOT EXISTS "VaultMetadata" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "relativePath" TEXT NOT NULL,
    "schemaVersion" INTEGER NOT NULL
  );
	CREATE INDEX "idx_notes_id" ON "notes"("id");
	CREATE VIRTUAL TABLE [notes_fts] USING FTS5 (
			fname, id,
			content=[notes]
	);`
      .split(";")
      .slice(0, -1);
    queries.push(`CREATE TRIGGER notes_ai AFTER INSERT ON notes
    BEGIN
        INSERT INTO notes_fts (fname, id)
        VALUES (new.fname, new.id);
    END;`);
    queries.push(`CREATE TRIGGER notes_ad AFTER DELETE ON notes
      BEGIN
        INSERT INTO notes_fts (notes_fts, rowid, fname, id) VALUES ('delete', old.rowid, old.id, old.fname);
      END;`);
    queries.push(`CREATE TRIGGER notes_au AFTER UPDATE ON notes
    BEGIN
      INSERT INTO notes_fts(notes_fts, rowid, fname, id) VALUES('delete', old.rowid, old.id, old.fname);
      INSERT INTO notes_fts(rowid, fname, id) VALUES (new.rowid, new.fname, new.id);
    END;`);
    return asyncLoopOneAtATime<string>(queries, async (_query) => {
      return getPrismaClient().$queryRawUnsafe(_query);
    });
  }

  static async bulkInsertAllNotesAndUpdateVaultMetadata({
    notesIdDict,
    vault,
  }: {
    notesIdDict: NotePropsByIdDict;
    vault: DVault;
  }) {
    const prisma = getPrismaClient();
    // bulk insert
    const sqlBegin = "INSERT INTO 'notes' ('fname', 'id', 'vault') VALUES ";
    const sqlEnd = _.values(notesIdDict)
      .map(({ fname, id, vault }) => {
        return `('${fname}', '${id}', '${VaultUtils.getName(vault)}')`;
      })
      .join(",");
    const fullQuery = sqlBegin + sqlEnd;
    // eslint-disable-next-line no-useless-catch
    try {
      await prisma.$queryRawUnsafe(fullQuery);
      await prisma.vaultMetadata.create({
        data: {
          relativePath: vault.fsPath,
          schemaVersion: 0,
        },
      });
    } catch (error) {
      // uncomment to log
      console.log("---> ERROR START");
      console.log(fullQuery);
      fs.writeFileSync("/tmp/query.txt", fullQuery);
      console.log("---> ERROR END");
      throw error;
    }
    return { query: fullQuery };
  }

  static async search(
    query: string
  ): Promise<{ hits: NoteIndexLightProps[]; query: string }> {
    query = transformQuery(query).join(" ");
    const raw = `SELECT * FROM notes_fts WHERE notes_fts = '"fname" : NEAR(${query})'`;
    return {
      hits: (await getPrismaClient().$queryRawUnsafe(
        raw
      )) as unknown as NoteIndexLightProps[],
      query: raw,
    };
  }
}

function transformQuery(query: string): string[] {
  return query.split(" ").map((ent) => `"${ent}"*`);
}
