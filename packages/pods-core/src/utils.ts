import {
  PodClassEntryV2,
  PodClassEntryV3,
  PodClassEntryV4,
  PodItem,
  PodItemV3,
  PodItemV4,
} from "./types";

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

export const podClassEntryToPodItemV4 = (p: PodClassEntryV4): PodItemV4 => {
  return {
    id: p.id,
    description: p.description,
    podClass: p,
  };
};
