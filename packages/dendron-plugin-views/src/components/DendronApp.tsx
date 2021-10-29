import {
  DMessageSource,
  DMessageType,
  OnDidChangeActiveTextEditorMsg,
  SeedBrowserMessageType,
  ThemeMessageType,
} from "@dendronhq/common-all";
import {
  batch,
  createLogger,
  Provider,
  setLogLevel,
  combinedStore,
  ideHooks,
  useVSCodeMessage,
  engineHooks,
} from "@dendronhq/common-frontend";
import React from "react";
import { DendronComponent, WorkspaceProps } from "../types";
import { postVSCodeMessage } from "../utils/vscode";

const { useEngineAppSelector, useEngine } = engineHooks;


function DendronVSCodeApp({Component}: {Component: DendronComponent}) {
  const ide = ideHooks.useIDEAppSelector((state) => state.ide);
  const engine = useEngineAppSelector((state) => state.engine);
  const ideDispatch = ideHooks.useIDEAppDispatch();
  const [workspaceOpts, setWorkspaceOpts] = React.useState<WorkspaceProps>();
  const logger = createLogger("DendronApp");

  // === Hooks
  // run once
  React.useEffect(() => {
    setLogLevel("INFO");
    // tell vscode that the client is ready
    postVSCodeMessage({
      type: DMessageType.INIT,
      data: {},
      source: DMessageSource.webClient,
    });
    // TODO
    logger.info("AppVSCode.init");
  }, []);

  // register a listener for vscode messages
  useVSCodeMessage(async (msg) => {
    const ctx = "useVSCodeMsg";
  });
  return <div> 
    Dendron App Wrapper
    <hr/>
    <Component />
  </div>
}

function DendronApp(props: {
  Component: DendronComponent
}) {
  return (
    <Provider store={combinedStore}>
      <DendronVSCodeApp {...props} />
    </Provider>
  );
}

export default DendronApp;