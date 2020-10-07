import { DendronError } from "./error";
import { EngineDeleteOpts, NoteData, SchemaData } from "./types";

export type DNodePointerV2 = string;
export type DNodeTypeV2 = "note" | "schema";

export type SchemaDataV2 = SchemaData;
export type NoteDataV2 = NoteData;

/**
 * Props are the official interface for a node
 */
export type DNodePropsV2<T = any> = {
  id: string;
  title: string;
  desc: string;
  fname: string;
  type: DNodeTypeV2;
  updated: string;
  created: string;
  stub?: boolean;
  schemaStub?: boolean;
  parent: DNodePointerV2 | null;
  children: DNodePointerV2[];
  data: T;
  body: string;
  custom?: any;
  schema?: { moduleId: string; schemaId: string };
};

/**
 * Opts are arguments used when creating a node
 */
export type DNodeOptsV2<T = any> = Partial<
  Omit<DNodePropsV2<T>, "fname|type"> & { fname: string; type: DNodeTypeV2 }
> & { fname: string; type: DNodeTypeV2 };

export type SchemaRawV2 = Pick<SchemaPropsV2, "id"> &
  Partial<SchemaDataV2> & { title?: string; desc?: string } & Partial<
    Pick<DNodePropsV2, "children">
  >;

export type SchemaOptsV2 = Omit<DNodeOptsV2<SchemaData>, "type" | "id"> & {
  id: string;
};
export type NoteOptsV2 = Omit<DNodeOptsV2<NoteDataV2>, "type">;

export type DNodePropsQuickInputV2<T = any> = DNodePropsV2<T> & {
  label: string;
  detail?: string;
  alwaysShow?: boolean;
};

export type SchemaPropsV2 = DNodePropsV2<SchemaData>;
export type NotePropsV2 = DNodePropsV2<NoteDataV2>;

export type DNodePropsDictV2 = {
  [key: string]: DNodePropsV2;
};

export type NotePropsDictV2 = {
  [key: string]: NotePropsV2;
};

export type SchemaPropsDictV2 = {
  [key: string]: SchemaPropsV2;
};

export type SchemaModuleDictV2 = {
  [key: string]: SchemaModulePropsV2;
};

// ---

export type SchemaImportV2 = string[];
export type SchemaModuleOptsV2 = {
  version: number;
  imports?: SchemaImportV2;
  schemas: SchemaOptsV2[];
};

export type SchemaModulePropsV2 = {
  version: number;
  imports?: SchemaImportV2;
  schemas: SchemaPropsDictV2;
  root: SchemaPropsV2;
  fname: string;
};

// === Engine

export interface RespV2<T> {
  data: T;
  error: DendronError | null;
}

export interface QueryOptsV2 {
  /**
   * Should add to full nodes
   */
  fullNode?: boolean;
  /**
   * Just get one result
   */
  queryOne?: boolean;
  /**
   * If node does not exist, create it?
   */
  createIfNew?: boolean;
}

export type EngineUpdateNodesOptsV2 = {
  /**
   * New Node, should add to `fullNode` cache
   */
  newNode: boolean;
};
export type EngineDeleteOptsV2 = EngineDeleteOpts;
export type EngineWriteOptsV2 = {
  /**
   * Write all children?
   * default: false
   */
  recursive?: boolean;
} & Partial<EngineUpdateNodesOptsV2>;

export type DEngineInitPayloadV2 = {
  notes?: NotePropsDictV2;
  schemas?: SchemaModuleDictV2;
};

/**
 * Returns list of notes that were changed
 */
export type WriteNoteResp = RespV2<NotePropsV2[]>;

// === Engine and Store Main

export type DCommonProps = {
  notes: NotePropsDictV2;
  schemas: SchemaModuleDictV2;
  vaults: string[];
};

export type DCommonMethods = {
  updateNote(note: NotePropsV2, opts?: EngineUpdateNodesOptsV2): Promise<void>;
  updateSchema: (schema: SchemaModulePropsV2) => Promise<void>;

  writeNote: (
    note: NotePropsV2,
    opts?: EngineWriteOptsV2
  ) => Promise<WriteNoteResp>;
  writeSchema: (schema: SchemaModulePropsV2) => Promise<void>;
};

export type DEngineV2 = DCommonProps &
  DCommonMethods & {
    store: DStoreV2;

    init: () => Promise<RespV2<DEngineInitPayloadV2>>;
    delete: (
      id: string,
      mode: DNodeTypeV2,
      opts?: EngineDeleteOptsV2
    ) => Promise<void>;

    getSchema: (qs: string) => Promise<RespV2<SchemaModulePropsV2>>;

    querySchema: (qs: string) => Promise<RespV2<SchemaModulePropsV2[]>>;
    query: (
      queryString: string,
      mode: DNodeTypeV2,
      opts?: QueryOptsV2
    ) => Promise<RespV2<DNodePropsV2[]>>;
  };

export type DEngineClientV2 = Omit<DEngineV2, "store" | "vaults">;

export type DStoreV2 = DCommonProps &
  DCommonMethods & {
    init: () => Promise<DEngineInitPayloadV2>;
  };
