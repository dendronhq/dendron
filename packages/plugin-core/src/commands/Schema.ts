import { DEngine, Note, Schema } from "@dendronhq/common-all";
import { createLogger } from "@dendronhq/common-server";
import { DendronEngine } from "@dendronhq/engine-server";
import _ from "lodash";
import { BasicCommand } from "./base";

const L = createLogger("SchemaCommand");

type SchemaCommandOpts = {
  root: string;
};

function applySchema(note: Note, schema: Schema) {
  note.data.schemaId = schema.id;
  note.children.map((noteChild) => {
    const schemaMatch: Schema | undefined = _.find(
      schema.children as Schema[],
      (schemaChild) => {
        return (schemaChild as Schema).match(noteChild as Note);
      }
    );
    if (schemaMatch) {
      return applySchema(noteChild as Note, schemaMatch);
    } else {
      return applySchema(noteChild as Note, Schema.createUnkownSchema());
    }
  });
}

export class SchemaCommand extends BasicCommand<SchemaCommandOpts> {
  async hack(engine: DEngine) {
    const ctx = "execute";
    const schemas = _.values(engine.schemas.root.children);
    const notes = _.values(engine.notes);
    const domains = _.uniq(notes.map((ent) => ent.domain));
    L.info({ ctx, schemas, domains });
    await Promise.all(
      schemas.map((s) => {
        const matchedDomains = domains.filter((d) => {
          return d.fname === s.data.pattern;
        });
        return Promise.all(
          matchedDomains.map((m) => {
            // @ts-ignore
            m.children.map((note) => {
              applySchema(note as Note, s as Schema);
              if (!note.stub) {
                return engine.write(note, {
                  recursive: true,
                  parentsAsStubs: true,
                });
              }
            });
          })
        );
      })
    );
  }

  async execute(opts: SchemaCommandOpts) {
    const ctx = "execute";
    L.info({ ctx, opts });
    const engine = await DendronEngine.getOrCreateEngine({
      forceNew: true,
      mode: "exact",
      root: opts.root,
    });
    await engine.init();
    await this.hack(engine);
  }
}

// async function main() {
//     const root = process.argv[2];
//     await new SchemaCommand().execute({
//         root,
//     });
// }
