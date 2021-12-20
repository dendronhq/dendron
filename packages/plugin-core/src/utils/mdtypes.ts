import { Location } from "vscode";

export type FoundRefT = {
  location: Location;
  matchText: string;
  isCandidate?: boolean;
};
