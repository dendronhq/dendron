import {
  EngineDeleteOpts,
  NoteData,
  Resp,
  SchemaData,
  UpdateNodesOpts,
} from "./types";

export type DNodePointerV2 = string;
export type DNodeTypeV2 = "note" | "schema";

export type SchemaDataV2 = SchemaData;
export type NoteDataV2 = NoteData;

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
};

export type DNodeOptsV2<T = any> = Partial<
  Omit<DNodePropsV2<T>, "fname|type">
> & { fname: string; type: DNodeTypeV2 };
export type SchemaOptsV2 = Omit<DNodeOptsV2<SchemaData>, "type">;
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
  [key: string]: DNodePropsV2;
};

export type SchemaPropsDictV2 = {
  [key: string]: DNodePropsV2;
};

// === Engine

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
   * Use with `createIfNew`
   * If true, create a stub node.
   * A stub node is not written to disk
   */
  stub?: boolean;
  /**
   * If node does not exist, create it?
   */
  createIfNew?: boolean;
}

type UpdateNodesOptsV2 = UpdateNodesOpts;
type EngineDeleteOptsV2 = EngineDeleteOpts;

export type DEngineV2 = {
  notes: NotePropsDictV2;
  schemas: SchemaPropsDictV2;

  init: () => Promise<void>;
  updateNodes(nodes: DNodePropsV2[], opts: UpdateNodesOptsV2): Promise<void>;

  delete: (
    id: string,
    mode: DNodeTypeV2,
    opts?: EngineDeleteOptsV2
  ) => Promise<void>;

  query: (
    queryString: string,
    mode: DNodeTypeV2,
    opts?: QueryOptsV2
  ) => Promise<Resp<DNodePropsV2[]>>;
};
