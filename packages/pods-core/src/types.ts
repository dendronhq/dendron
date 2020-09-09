import { PodOptsV2, Pod, PodConfigEntry } from "./base";

export interface PodClassEntryV2 {
  id: string;
  description: string;
  kind: PodKind;
  config: () => PodConfigEntry[];
  new (opts: PodOptsV2): Pod;
}

export type PodItem = {
  id: string;
  description: string;
  podClass: PodClassEntryV2;
};

export type PodKind = "import" | "export";
