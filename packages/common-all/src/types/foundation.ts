import { DNoteAnchorPositioned } from "./typesv2";
import { URI } from "vscode-uri";
import { DVault } from "./workspace";

export interface Point {
  /**
   * Line in a source file (1-indexed integer).
   */
  line: number;

  /**
   * Column in a source file (1-indexed integer).
   */
  column: number;
  /**
   * Character in a source file (0-indexed integer).
   */
  offset?: number;
}

export interface Position {
  /**
   * Place of the first character of the parsed source region.
   */
  start: Point;

  /**
   * Place of the first character after the parsed source region.
   */
  end: Point;

  /**
   * Start column at each index (plus start line) in the source region,
   * for elements that span multiple lines.
   */
  indent?: number[];
}

export type DLoc = {
  fname?: string;
  id?: string;
  vaultName?: string;
  uri?: URI;
  anchorHeader?: string;
};

/**
 @deprecated use {@link DNoteLink}
 */
export type DLink = {
  type: "ref" | "wiki" | "md" | "backlink" | "linkCandidate" | "frontmatterTag";
  value: string;
  alias?: string;
  position?: Position;
  from: DLoc;
  to?: DLoc;
  xvault?: boolean;
  /** Denotes a same file link, for example `[[#anchor]]` */
  sameFile?: boolean;
};

export type DNodeType = "note" | "schema";
export type DNodePointer = string;
export type DNodeImage = { url: string; alt: string };

export const REQUIRED_DNODEPROPS: (keyof DNodeProps)[] = [
  "id",
  "title",
  "desc",
  "links",
  "anchors",
  "fname",
  "type",
  "updated",
  "created",
  "parent",
  "children",
  "data",
  "body",
  "vault",
];

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
   * Anchors within the node (headings, block anchors)
   */
  anchors: { [index: string]: DNoteAnchorPositioned | undefined };
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

  /**
   * Hash of note content
   */
  contentHash?: string;

  /** Override the randomly generated color for tag notes. Colors can be entered as `#12AC35`, `rgb(123, 56, 200)`, or `hsl(235, 100%, 50%)`. */
  color?: string;

  /** One or more frontmatter tags attached to this note. */
  tags?: string | string[];

  /** To be used by social media platforms as a thumbnail/preview. */
  image?: DNodeImage;
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
export type SEOProps = {
  title: string;
  updated: number;
  created: number;
  excerpt?: string;
  image?: DNodeImage;
  /**
   * Use as root canonical url for all published notes
   */
  canonicalBaseUrl?: string;
  canonicalUrl?: string;
  noindex?: boolean;
  twitter?: string;
};
