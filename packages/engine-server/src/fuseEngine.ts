import {
  DEngineMode,
  DVault,
  NotePropsDict,
  NoteProps,
  SchemaModuleDict,
  SchemaModuleProps,
  SchemaProps,
  SchemaUtils,
} from "@dendronhq/common-all";
import Fuse from "fuse.js";
import _ from "lodash";

export type NoteIndexProps = {
  id: string;
  title: string;
  fname: string;
  vault: DVault;
};

function createFuse<T>(
  initList: T[],
  opts: Fuse.IFuseOptions<any> & {
    exactMatch: boolean;
    preset: "schema" | "note";
  }
) {
  const options = {
    shouldSort: true,
    threshold: opts.exactMatch ? 0.0 : 0.6,
    location: 0,
    distance: 50,
    maxPatternLength: 32,
    minMatchCharLength: 2,
    keys: ["fname"],
    useExtendedSearch: true,
    includeScore: true,
  };
  if (opts.preset === "schema") {
    options.keys = ["fname", "id"];
  }
  const fuse = new Fuse(initList, options);
  return fuse;
}

type FuseEngineOpts = {
  mode?: DEngineMode;
};

export class FuseEngine {
  public notesIndex: Fuse<NoteIndexProps>;
  public schemaIndex: Fuse<SchemaProps>;

  constructor(opts: FuseEngineOpts) {
    this.notesIndex = createFuse<NoteProps>([], {
      exactMatch: opts.mode === "exact",
      preset: "note",
    });
    this.schemaIndex = createFuse<SchemaProps>([], {
      exactMatch: opts.mode === "exact",
      preset: "schema",
    });
  }

  async querySchema({ qs }: { qs: string }): Promise<SchemaProps[]> {
    let items: SchemaProps[];
    if (qs === "") {
      const results = this.schemaIndex.search("root");
      items = [results[0].item];
    } else if (qs === "*") {
      // @ts-ignore
      items = this.schemaIndex._docs;
    } else {
      const results = this.schemaIndex.search(qs);
      items = _.map(results, (resp) => resp.item);
    }
    return items;
  }

  /**
   * If qs = "", return root note
   * @param param0
   * @returns
   */
  queryNote({ qs }: { qs: string }): NoteIndexProps[] {
    let items: NoteIndexProps[];
    if (qs === "") {
      const results = this.notesIndex.search("root");
      items = _.map(
        _.filter(results, (ent) => ent.item.fname === "root"),
        (ent) => ent.item
      );
    } else if (qs === "*") {
      // @ts-ignore
      items = this.notesIndex._docs as NoteProps[];
    } else {
      const results = this.notesIndex.search(qs);
      items = _.map(results, (resp) => resp.item);
    }
    return items;
  }

  async updateSchemaIndex(schemas: SchemaModuleDict) {
    this.schemaIndex.setCollection(
      _.map(_.values(schemas), (ent) => SchemaUtils.getModuleRoot(ent))
    );
  }

  async updateNotesIndex(notes: NotePropsDict) {
    this.notesIndex.setCollection(
      _.map(notes, ({ fname, title, id, vault }, _key) => ({
        fname,
        id,
        title,
        vault,
      }))
    );
  }

  async removeNoteFromIndex(note: NoteProps) {
    this.notesIndex.remove((doc) => {
      // FIXME: can be undefined, dunno why
      if (!doc) {
        return false;
      }
      return doc.id === note.id;
    });
  }

  async removeSchemaFromIndex(smod: SchemaModuleProps) {
    this.schemaIndex.remove((doc: SchemaProps) => {
      // FIXME: can be undefined, dunno why
      if (!doc) {
        return false;
      }
      return doc.id === SchemaUtils.getModuleRoot(smod).id;
    });
  }
}
