import { PodConfigEntry } from "./builtin";
import { PodOptsV2, Pod } from "./base";

export interface PodClassEntryV2 {
  id: string;
  description: string;
  config: () => PodConfigEntry[];
  new (opts: PodOptsV2): Pod;
}

export type PodItem = {
  id: string;
  description: string;
  podClass: PodClassEntryV2;
};
