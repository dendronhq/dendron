import { URI } from "vscode-uri";
import { DVault } from "./workspace";

export type DLoc = {
  fname?: string;
  id?: string;
  vault?: DVault;
  uri?: URI;
  anchorHeader?: string;
};

export type DLink = {
  type: "ref" | "wiki" | "md" | "backlink";
  original: string;
  value: string;
  alias?: string;
  pos: {
    start: number;
    end: number;
  };
  from: DLoc;
  to?: DLoc;
};

export type DNodeType = "note" | "schema";
export type DNodePointer = string;

/**
 * Props are the official interface for a node
 */
export type DNodeProps<T = any, TCustom = any> = {
  id: string;
  title: string;
  desc: string;
  links: DLink[];
  fname: string;
  type: DNodeType;
  updated: number;
  created: number;
  stub?: boolean;
  schemaStub?: boolean;
  parent: DNodePointer | null;
  children: DNodePointer[];
  data: T;
  body: string;
  custom?: TCustom;
  schema?: { moduleId: string; schemaId: string };
  vault: DVault;
};

export type SchemaData = {
  namespace?: boolean;
  pattern?: string;
  template?: SchemaTemplate;
};

export type SchemaTemplate = {
  id: string;
  type: "snippet" | "note";
};

export type SchemaProps = DNodeProps<SchemaData>;
export type NoteProps = DNodeProps<any, any>;
