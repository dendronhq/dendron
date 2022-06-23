import {
  DEngineClient,
  DVault,
  NotePropsByIdDict,
} from "@dendronhq/common-all";

export type ImportType = {
  moduleName: string;
  defaultImport: string;
  namedImports: Record<string, string>[];
  starImport: string;
  sideEffectOnly: boolean;
};
export type CommitType = {
  hash: string;
  subject: string;
  author: string;
  date: string;
  diff: { added: number; removed: number; modified: number };
};
export type FileType = {
  name: string;
  path: string;
  size: number;
  commits?: CommitType[];
  imports?: ImportType[];
  numberOfLines?: number;
  children?: FileType[];
};
export type InputArgs = {
  wsRoot: string;
  out?: string;
};
export type VisualizationInput = InputArgs & {
  notes: NotePropsByIdDict;
  vault: DVault;
};
export type GenerateSVGInput = InputArgs & {
  engine: DEngineClient;
};
