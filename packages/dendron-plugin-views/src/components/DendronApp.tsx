import {
  DMessageEnum,
  DMessageSource,
  OnDidChangeActiveTextEditorMsg,
} from "@dendronhq/common-all";
import {
  combinedStore,
  createLogger,
  engineHooks,
  engineSlice,
  ideHooks,
  ideSlice,
  Provider,
  setLogLevel,
} from "@dendronhq/common-frontend";
import _ from "lodash";
import React from "react";
import { useWorkspaceProps } from "../hooks";
import { DendronComponent } from "../types";
import { postVSCodeMessage, useVSCodeMessage } from "../utils/vscode";
import "../styles/scss/main.scss";
import { Layout} from "antd";
const {Content} = Layout;

const { useEngineAppSelector, useEngine } = engineHooks;

function DendronVSCodeApp({ Component }: { Component: DendronComponent }) {
  const ctx = "DendronVSCodeApp";
  const ide = ideHooks.useIDEAppSelector((state) => state.ide);
  const engine = useEngineAppSelector((state) => state.engine);
  const ideDispatch = ideHooks.useIDEAppDispatch();
  const [workspace] = useWorkspaceProps();
  const logger = createLogger("DendronApp");

  logger.info({ ctx, workspace });
  // used to initialize the engine
  useEngine({ engineState: engine, opts: workspace });

  const props = {
    engine,
    ide,
    workspace,
  };

  // === Hooks
  // run once
  React.useEffect(() => {
    setLogLevel("INFO");
    // tell vscode that the client is ready
    postVSCodeMessage({
      type: DMessageEnum.INIT,
      data: { src: ctx },
      source: DMessageSource.webClient,
    });
    logger.info({ ctx, msg: "postVSCodeMessage" });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // register a listener for vscode messages
  useVSCodeMessage(async (msg) => {
    const ctx = "useVSCodeMsg";
    logger.info({ ctx, msgType: msg.type });
    switch (msg.type) {
      case DMessageEnum.ON_DID_CHANGE_ACTIVE_TEXT_EDITOR:
        const cmsg = msg as OnDidChangeActiveTextEditorMsg;
        const { sync, note, syncChangedNote } = cmsg.data;
        if (sync) {
          // skip the initial ?
          logger.info({
            ctx,
            msg: "syncEngine:pre",
          });
          await ideDispatch(engineSlice.initNotes(workspace));
        }
        if (syncChangedNote && note) {
          await ideDispatch(engineSlice.syncNote({ ...workspace, note }));
        }
        logger.info({ ctx, msg: "syncEngine:post" });
        ideDispatch(ideSlice.actions.setNoteActive(note));
        logger.info({ ctx, msg: "setNote:post" });
        break;
      default:
        logger.error({ ctx, msg: "unknown message", payload: msg });
        break;
    }
  });

  // don't load until active
  if (_.isEmpty(engine.notes)) {
    return <div>Loading...</div>;
  }

  return <Component {...props} />;
}

function DendronApp(props: { Component: DendronComponent }) {
  return (
    <Provider store={combinedStore}>
      <Layout style={{padding: "33px"}}>
        <Content>
          <DendronVSCodeApp {...props} />
        </Content>
      </Layout>
    </Provider>
  );
}

export default DendronApp;
