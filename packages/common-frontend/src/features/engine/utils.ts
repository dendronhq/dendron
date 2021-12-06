import _ from "lodash";
import { EngineState } from "./slice";

export const hasInitialized = (engine: EngineState) => {
  return (
    engine.loading === "idle" &&
    !_.isUndefined(engine.notes) &&
    !_.isUndefined(engine.vaults)
  );
};
