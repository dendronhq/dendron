import { PodClassEntryV2, PodItem } from "./types";

export const podClassEntryToPodItem = (p: PodClassEntryV2): PodItem => {
  return {
    id: p.id,
    description: p.description,
    podClass: p,
  };
};
