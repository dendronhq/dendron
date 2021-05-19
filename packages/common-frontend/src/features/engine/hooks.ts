import { Logger } from "@aws-amplify/core";
import _ from "lodash";
import { useEffect } from "react";
import { TypedUseSelectorHook, useDispatch, useSelector } from "react-redux";
import { EngineState, InitNoteOpts, initNotes } from "./slice";
import { AppDispatch, RootState } from "./store";

export const useEngineAppDispatch = () => useDispatch<AppDispatch>();
export const useEngineAppSelector: TypedUseSelectorHook<RootState> =
  useSelector;

export const useEngine = ({
  engine,
  opts,
}: {
  engine: EngineState;
  opts: Partial<InitNoteOpts>;
}) => {
  const dispatch = useEngineAppDispatch();
  const logger = new Logger("useEngine");
  useEffect(() => {
    logger.info({ ctx: "useEffect", state: "enter" });
    // initialize engine
    if (engine.error) {
      return engine.error;
    }
    if (engine.loading === "idle" && _.isEmpty(engine.notes)) {
      logger.info({ msg: "dispatch notes" });
      if (_.isUndefined(opts.port)) {
        console.error("no query");
        return;
      }
      if (!opts.ws) {
        console.error("no workspace");
        return;
      }
      logger.info({ ctx: "useEffect", state: "initEngine" });
      dispatch(initNotes({ port: parseInt(opts.port as any), ws: opts.ws }));
    }
    logger.info({ ctx: "useEffect", state: "exit", engine });
  }, [engine.loading, opts.port, opts.ws]);
};
