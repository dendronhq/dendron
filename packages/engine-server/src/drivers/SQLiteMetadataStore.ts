import { asyncLoopOneAtATime, NotePropsByIdDict } from "@dendronhq/common-all";
import { PrismaClient } from "../generated-prisma-client";
import _ from "lodash";

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
    // "DATABASE_URL="file://Users/kevinlin/code/dendron/local/notes.db"""
    _prisma = new PrismaClient({
      datasources: {
        db: {
          url: `file://${wsRoot}/metadata.db`,
        },
      },
    });
  }

  static async isInitialized(): Promise<boolean> {
    // valid result: [ { name: "notes", }, ]
    const query = `SELECT name FROM sqlite_master WHERE type='table' AND name='notes'`;
    const resp = (await getPrismaClient().$queryRawUnsafe(query)) as {
      name: string;
    }[];
    return resp.length === 1;
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
        return `('${fname}', '${id}')`;
      })
      .join(",");
    const fullQuery = sqlBegin + sqlEnd;
    return prisma.$queryRawUnsafe(fullQuery);
  }

  static async search(query: string): Promise<NoteIndexLightProps[]> {
    // Prisma.sql`SELECT * FROM User WHERE email = ${email}`;
    const raw = `SELECT * FROM notes_fts WHERE notes_fts = '"fname" : NEAR("${query}"*)'`;
    return getPrismaClient().$queryRawUnsafe(raw);
  }
}
