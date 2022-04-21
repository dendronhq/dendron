import { DEngineInitPayload, NoteFNamesDict } from "@dendronhq/common-all";
import _ from "lodash";

export enum LoadingStatus {
  IDLE = "idle",
  PENDING = "pending",
  FULFILLED = "fulfilled",
}

export type EngineSliceState = {
  error: any;
  loading: LoadingStatus;
  currentRequestId: string | undefined;
  noteFName: NoteFNamesDict;
} & Partial<DEngineInitPayload> &
  Pick<DEngineInitPayload, "notes" | "schemas" | "vaults">;

export function verifyEngineSliceState(
  opts: Partial<EngineSliceState>
): opts is Required<EngineSliceState> {
  const engineSliceKeys: (keyof EngineSliceState)[] = ["notes", "config"];
  return _.every(engineSliceKeys, (k) => !_.isUndefined(opts[k]));
}

export type WorkspaceProps = {
  url: string;
  ws: string;
  theme?: string;
  /**
   * workspace loaded through browser
   */
  browser?: boolean;
};
