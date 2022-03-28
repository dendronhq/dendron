import _ from "lodash";
import { useEffect } from "react";
import { TypedUseSelectorHook, useDispatch, useSelector } from "react-redux";
import { engineSliceUtils } from ".";
import { createLogger } from "../../utils";
import { EngineState, InitNoteOpts, initNotes, syncConfig } from "./slice";
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
    if (!engineSliceUtils.hasInitialized(engineState) || opts.force) {
      logger.info({ msg: "dispatch notes", force: opts.force });
      if (_.isUndefined(opts.url)) {
        return;
      }
      if (!opts.ws) {
        return;
      }
      logger.info({ ctx: "useEffect", state: "initEngine" });
      dispatch(initNotes({ url: opts.url, ws: opts.ws }));
    }
    logger.info({ ctx: "useEffect", state: "exit", engineState });
    return;
  }, [engineState.loading, opts.url, opts.ws]);
};

/**
 * Reloads the Dendron Config
 * @param opts.port?: workspace pot
 * @param opts.ws?: workspace root
 */
export const useConfig = ({
  opts,
}: {
  opts: Partial<InitNoteOpts> & { force?: boolean };
}) => {
  const dispatch = useEngineAppDispatch();
  const logger = createLogger("syncConfig");
  useEffect(() => {
    logger.info({ ctx: "useEffect", state: "enter" });

    if (_.isUndefined(opts.url)) {
      return;
    }
    if (!opts.ws) {
      return;
    }
    logger.info({ ctx: "useEffect", state: "syncConfig" });
    dispatch(syncConfig({ url: opts.url, ws: opts.ws }));
    logger.info({ ctx: "useEffect", state: "exit" });
    return;
  }, []);
};
