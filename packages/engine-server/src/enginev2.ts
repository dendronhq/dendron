import {
  DEngineInitPayloadV2,
  DEngineMode,
  DEngineV2,
  DNodePropsV2,
  DNodeTypeV2,
  DNodeUtilsV2,
  DStoreV2,
  EngineDeleteOptsV2,
  EngineUpdateNodesOptsV2,
  EngineWriteOptsV2,
  NotePropsDictV2,
  NotePropsV2,
  QueryOptsV2,
  Resp,
  RespV2,
  SchemaModulePropsV2,
  SchemaPropsDictV2,
  SchemaPropsV2,
  SchemaUtilsV2,
} from "@dendronhq/common-all";
import { DLogger } from "@dendronhq/common-server";
import Fuse from "fuse.js";
import _ from "lodash";
import { SchemaParserV2 } from "../lib";

type DendronEngineOptsV2 = {
  vaults: string[];
  forceNew?: boolean;
  store?: any;
  mode?: DEngineMode;
  logger?: DLogger;
};
type DendronEnginePropsV2 = Required<DendronEngineOptsV2>;

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
    distance: 100,
    maxPatternLength: 32,
    minMatchCharLength: 1,
    keys: ["title", "fname", "basename"],
    useExtendedSearch: true,
  };
  if (opts.preset === "schema") {
    options.keys = ["title", "id"];
  }
  const fuse = new Fuse(initList, options);
  return fuse;
}

function isAllQuery(qs: string): boolean {
  return qs === "**/*";
}

export class DendronEngine implements DEngineV2 {
  public vaults: string[];
  public store: DStoreV2;
  protected notesIndex: Fuse<NotePropsV2>;
  protected schemaIndex: Fuse<SchemaPropsV2>;
  protected props: DendronEnginePropsV2;
  public logger: DLogger;

  constructor(props: DendronEnginePropsV2) {
    this.vaults = props.vaults;
    this.store = props.store;
    this.notesIndex = createFuse<NotePropsV2>([], {
      exactMatch: props.mode === "exact",
      preset: "note",
    });
    this.schemaIndex = createFuse<SchemaPropsV2>([], {
      exactMatch: props.mode === "exact",
      preset: "schema",
    });
    this.logger = props.logger;
    this.props = props;
  }

  get notes() {
    return this.store.notes;
  }
  get schemas() {
    return this.store.schemas;
  }

  async init(): Promise<RespV2<DEngineInitPayloadV2>> {
    try {
      const { notes, schemas } = await this.store.init();
      return {
        error: null,
        data: { notes, schemas },
      };
    } catch (error) {
      return {
        error,
        data: {},
      };
    }
  }

  async delete(
    id: string,
    mode: DNodeTypeV2,
    opts?: EngineDeleteOptsV2
  ): Promise<void> {
    throw Error("to implement");
    return;
  }
  //   updateNodes(
  //     nodes: DNodePropsV2[],
  //     opts: EngineUpdateNodesOptsV2
  //   ): Promise<void>;

  //   delete: (
  //     id: string,
  //     mode: DNodeTypeV2,
  //     opts?: EngineDeleteOptsV2
  //   ) => Promise<void>;

  async query(
    queryString: string,
    mode: DNodeTypeV2,
    opts?: QueryOptsV2
  ): Promise<RespV2<DNodePropsV2[]>> {
    const ctx = "query";
    let data: RespV2<DNodePropsV2[]>;
    const cleanOpts = _.defaults(opts || {}, {
      fullNode: false,
      createIfNew: false,
      initialQuery: false,
      stub: false,
    });

    // get everything
    if (isAllQuery(queryString)) {
      this.logger.info({ ctx, msg: "queryAll", mode });
      try {
      } catch (err) {
        // TODO
      }
    }
    return {} as any;
  }

  async updateNote(
    note: NotePropsV2,
    opts?: EngineUpdateNodesOptsV2
  ): Promise<void> {
    throw Error("not implemented");
    return;
  }

  async updateSchema(schemaModule: SchemaModulePropsV2) {
    return await this.store.updateSchema(schemaModule);
  }

  async writeNote(note: NotePropsV2, opts?: EngineWriteOptsV2): Promise<void> {
    throw Error("to implement");
    return;
  }

  async writeSchema(schema: SchemaModulePropsV2) {
    return this.store.writeSchema(schema);
  }

  //   write: (node: DNodePropsV2, opts?: EngineWriteOptsV2) => Promise<void>;
}
