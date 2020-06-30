import { createLogger } from "@dendronhq/common-server";
import { BaseCommand } from "./base";
import { getOrCreateEngine } from "@dendronhq/engine-server";
import _ from "lodash";
import { Note, Schema, SchemaNodeRaw } from "@dendronhq/common-all";

const L = createLogger("SchemaCommand");

type SchemaCommandOpts = {
    root: string
};


function applySchema(note: Note, schema: Schema) {
    note.data.schemaId = schema.id;
    // schema.children.forEach(schema=> {
    //     schema as Schema
    // });
    note.children.map(noteChild => {
        // @ts-ignore
        const mschema: [Note, Schema][] = _.map(schema.children, schemaChild => {
            if ((schemaChild as Schema).match(noteChild as Note)) {
                return [noteChild, schemaChild];
            } else {
                return false;
            }
        }).filter(Boolean);
        mschema.forEach(match => {
            return applySchema(...match);
        });
    });

}

export class SchemaCommand extends BaseCommand<SchemaCommandOpts> {
    async execute(opts: SchemaCommandOpts) {
        const ctx = "execute";
        L.info({ ctx, opts });
        const engine = await getOrCreateEngine({ forceNew: true, mode: "exact", root: opts.root });
        await engine.init();
        const schemas = _.values(engine.schemas.root.children);
        const notes = _.values(engine.notes);
        const domains = _.uniq(notes.map(ent => ent.domain));
        L.info({ ctx, schemas, domains });
        await Promise.all(schemas.map(s => {
            const matchedDomains = domains.filter(d => {
                return d.fname === s.data.pattern;
            });
            return Promise.all(matchedDomains.map(m => {
                // TODO: check if stub
                m.children.map(note => {
                    applySchema(note as Note, s as Schema);
                    // c.data.schemaId = s.id;
                    return engine.write(note, { recursive: true });
                });
            }));
        }));
    }
}

async function main() {
    const root = process.argv[2];
    await new SchemaCommand().execute({
        root,
    });
}

main();