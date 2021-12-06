import _ from "lodash";
import { EngineState } from "./slice";

export const hasInitialized = (engine: EngineState) => {
  return (
    engine.loading === "idle" &&
    !_.isEmpty(engine.notes) &&
    !_.isEmpty(engine.vaults)
  );
};
