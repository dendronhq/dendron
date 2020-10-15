import { PodOptsV2, Pod, PodConfigEntry, PodOptsV3 } from "./base";

export interface PodClassEntryV2 {
  id: string;
  description: string;
  kind: PodKind;
  config: () => PodConfigEntry[];
  new (opts: PodOptsV2): Pod;
}

export interface PodClassEntryV3 {
  id: string;
  description: string;
  kind: PodKind;
  config: () => PodConfigEntry[];
  new (opts: PodOptsV3): Pod;
}

export type PodItem = {
  id: string;
  description: string;
  podClass: PodClassEntryV2;
};

export type PodItemV3 = {
  id: string;
  description: string;
  podClass: PodClassEntryV3;
};

export type PodKind = "import" | "export" | "publish";
