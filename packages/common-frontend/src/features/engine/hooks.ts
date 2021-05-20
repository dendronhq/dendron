import _ from "lodash";
import { useEffect } from "react";
import { TypedUseSelectorHook, useDispatch, useSelector } from "react-redux";
import { createLogger } from "../../utils";
import { EngineState, InitNoteOpts, initNotes } from "./slice";
import { AppDispatch, RootState } from "./store";

export const useEngineAppDispatch = () => useDispatch<AppDispatch>();
export const useEngineAppSelector: TypedUseSelectorHook<RootState> =
  useSelector;

/**
 * Check if engineState is initialized and initialize if not
 * @param engineState: current Engine State
 * @param opts.port?: workspace pot
 * @param opts.ws?: workspace root
 * @param opts.force?: always reinitialize
 */
export const useEngine = ({
  engineState,
  opts,
}: {
  engineState: EngineState;
  opts: Partial<InitNoteOpts> & { force?: boolean };
}) => {
  const dispatch = useEngineAppDispatch();
  const logger = createLogger("useEngine");
  useEffect(() => {
    logger.info({ ctx: "useEffect", state: "enter" });
    // initialize engine
    if (engineState.error) {
      return engineState.error;
    }
    if (
      (engineState.loading === "idle" && _.isEmpty(engineState.notes)) ||
      opts.force
    ) {
      logger.info({ msg: "dispatch notes", force: opts.force });
      if (_.isUndefined(opts.port)) {
        return;
      }
      if (!opts.ws) {
        return;
      }
      logger.info({ ctx: "useEffect", state: "initEngine" });
      dispatch(initNotes({ port: parseInt(opts.port as any), ws: opts.ws }));
    }
    logger.info({ ctx: "useEffect", state: "exit", engineState });
    return;
  }, [engineState.loading, opts.port, opts.ws]);
};
