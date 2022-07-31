import { asyncLoopOneAtATime, NotePropsByIdDict } from "@dendronhq/common-all";
import { PrismaClient } from "@prisma/client";
import _ from "lodash";

let _prisma: PrismaClient | undefined;

function getPrismaClient(): PrismaClient {
  if (_prisma === undefined) {
    throw Error("prisma client not initialized");
  }
  return _prisma;
}

export class SQLiteMetadataStore {
  constructor({ wsRoot }: { wsRoot: string }) {
    // "DATABASE_URL="file://Users/kevinlin/code/dendron/local/notes.db"""
    _prisma = new PrismaClient({
      datasources: {
        db: {
          url: `file://${wsRoot}/metadata.db`,
        },
      },
    });
  }

  static isInitialized(): boolean {
    // TODO
    return false;
  }

  static async createAllTables() {
    const queries = `CREATE TABLE IF NOT EXISTS "notes" (
			"fname" TEXT,
			"id" TEXT NOT NULL PRIMARY KEY,
			"title" TEXT,
			"vault" TEXT,
			"stub" BIGINT
	, updated INTEGER);
	CREATE INDEX "idx_notes_id" ON "notes"("id");
	CREATE VIRTUAL TABLE [notes_fts] USING FTS5 (
			[fname],
			content=[notes]
	);
	CREATE TABLE IF NOT EXISTS 'notes_fts_data'(id INTEGER PRIMARY KEY, block BLOB);
	CREATE TABLE IF NOT EXISTS 'notes_fts_idx'(segid, term, pgno, PRIMARY KEY(segid, term)) WITHOUT ROWID;
	CREATE TABLE IF NOT EXISTS 'notes_fts_docsize'(id INTEGER PRIMARY KEY, sz BLOB);
	CREATE TABLE IF NOT EXISTS 'notes_fts_config'(k PRIMARY KEY, v) WITHOUT ROWID;`
      .split(";")
      .slice(0, -1);
    return asyncLoopOneAtATime<string>(queries, async (_query) => {
      return getPrismaClient().$queryRawUnsafe(_query);
    });
  }

  static async initializeMetadata(notesIdDict: NotePropsByIdDict) {
    const prisma = getPrismaClient();

    // create tables
    await this.createAllTables();

    // bulk insert
    const sqlBegin = "INSERT INTO 'notes' ('fname', 'id') VALUES ";
    const sqlEnd = _.values(notesIdDict)
      .map(({ fname, id }) => {
        return `('${fname}', ${id})`;
      })
      .join(",");
    const fullQuery = sqlBegin + sqlEnd;
    return prisma.$queryRawUnsafe(fullQuery);
  }
}
