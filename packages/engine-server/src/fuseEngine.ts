import {
  DEngineMode,
  DVault,
  NotePropsDictV2,
  NotePropsV2,
  SchemaModuleDictV2,
  SchemaModulePropsV2,
  SchemaPropsV2,
  SchemaUtilsV2,
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
    threshold: opts.exactMatch ? 0.0 : 0.5,
    location: 0,
    distance: 50,
    maxPatternLength: 32,
    minMatchCharLength: 2,
    keys: ["fname"],
    useExtendedSearch: true,
    includeScore: true,
  };
  if (opts.preset === "schema") {
    options.keys = ["fname"];
  }
  const fuse = new Fuse(initList, options);
  return fuse;
}

type FuseEngineOpts = {
  mode?: DEngineMode;
};

export class FuseEngine {
  public notesIndex: Fuse<NoteIndexProps>;
  public schemaIndex: Fuse<SchemaPropsV2>;

  constructor(opts: FuseEngineOpts) {
    this.notesIndex = createFuse<NotePropsV2>([], {
      exactMatch: opts.mode === "exact",
      preset: "note",
    });
    this.schemaIndex = createFuse<SchemaPropsV2>([], {
      exactMatch: opts.mode === "exact",
      preset: "schema",
    });
  }

  async querySchema({ qs }: { qs: string }): Promise<SchemaPropsV2[]> {
    let items: SchemaPropsV2[];
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

  queryNote({ qs }: { qs: string }): NoteIndexProps[] {
    let items: NoteIndexProps[];
    if (qs === "") {
      const results = this.notesIndex.search("root");
      items = [results[0].item];
    } else if (qs === "*") {
      // @ts-ignore
      items = this.notesIndex._docs as NotePropsV2[];
    } else {
      const results = this.notesIndex.search(qs);
      items = _.map(results, (resp) => resp.item);
    }
    return items;
  }

  async updateSchemaIndex(schemas: SchemaModuleDictV2) {
    this.schemaIndex.setCollection(
      _.map(_.values(schemas), (ent) => SchemaUtilsV2.getModuleRoot(ent))
    );
  }

  async updateNotesIndex(notes: NotePropsDictV2) {
    this.notesIndex.setCollection(
      _.map(notes, ({ fname, title, id, vault }, _key) => ({
        fname,
        id,
        title,
        vault,
      }))
    );
  }

  async removeNoteFromIndex(note: NotePropsV2) {
    this.notesIndex.remove((doc) => {
      // FIXME: can be undefined, dunno why
      if (!doc) {
        return false;
      }
      return doc.id === note.id;
    });
  }

  async removeSchemaFromIndex(smod: SchemaModulePropsV2) {
    this.schemaIndex.remove((doc: SchemaPropsV2) => {
      // FIXME: can be undefined, dunno why
      if (!doc) {
        return false;
      }
      return doc.id === SchemaUtilsV2.getModuleRoot(smod).id;
    });
  }
}
