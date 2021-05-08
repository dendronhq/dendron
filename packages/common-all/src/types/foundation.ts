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
  /**
   * Unique id of a note
   */
  id: string;
  /**
   * Node title
   */
  title: string;
  /**
   * Node description
   */
  desc: string;
  /**
   * Node links (eg. backlinks, wikilinks, etc)
   */
  links: DLink[];
  /**
   * Name of the node. This corresponds to the name of the file minus the extension
   */
  fname: string;
  /**
   * Whether this node is a note or a schema
   */
  type: DNodeType;
  /**
   * Last updated
   */
  updated: number;
  /**
   * Created
   */
  created: number;
  /**
   * Determines whether this node is a {@link stub https://wiki.dendron.so/notes/c6fd6bc4-7f75-4cbb-8f34-f7b99bfe2d50.html#stubs}
   */
  stub?: boolean;
  /**
   @deprecated
   */
  schemaStub?: boolean;
  /**
   * Immediate parent
   */
  parent: DNodePointer | null;
  /**
   * Immediate children
   */
  children: DNodePointer[];
  data: T;
  /**
   * Body of the note
   */
  body: string;
  /**
   * Custom frontmatter. Add additional fields here and they will show up in the note frontmatter
   */
  custom?: TCustom;
  /**
   * Schemas that apply to the note
   */
  schema?: { moduleId: string; schemaId: string };
  /**
   * The vault that a note belongs to
   */
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
