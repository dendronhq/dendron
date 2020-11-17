import { DEngineClientV2, DNoteLoc } from "@dendronhq/common-all";
import { Heading } from "mdast";

export type ReplaceLinkOpts = { from: DNoteLoc; to: DNoteLoc };
export { DEngineClientV2 };
export { Heading };

export type WSMeta = {
  version: string;
  activationTime: number;
};
