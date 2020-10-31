import { PodClassEntryV2, PodClassEntryV3, PodItem, PodItemV3 } from "./types";

export const podClassEntryToPodItem = (p: PodClassEntryV2): PodItem => {
  return {
    id: p.id,
    description: p.description,
    podClass: p,
  };
};

export const podClassEntryToPodItemV3 = (p: PodClassEntryV3): PodItemV3 => {
  return {
    id: p.id,
    description: p.description,
    podClass: p,
  };
};

export class PodUtils {
  // TODO
  // static requireArgs(): boolean {
  // }
}
