import {
  DMessageEnum,
  DMessageSource,
  LookupViewMessageEnum,
  NoteUtils,
  NoteViewMessageEnum,
  OnDidChangeActiveTextEditorMsg,
} from "@dendronhq/common-all";
import {
  combinedStore,
  createLogger,
  engineHooks,
  engineSlice,
  ideHooks,
  ideSlice,
  LOG_LEVEL,
  Provider,
  setLogLevel,
} from "@dendronhq/common-frontend";
import _ from "lodash";
import React from "react";
import { useWorkspaceProps } from "../hooks";
import { DendronComponent } from "../types";
import { postVSCodeMessage, useVSCodeMessage } from "../utils/vscode";
import "../styles/scss/main.scss";
import { Layout } from "antd";
const { Content } = Layout;

const { useEngineAppSelector, useEngine } = engineHooks;

function DendronVSCodeApp({ Component }: { Component: DendronComponent }) {
  const ctx = "DendronVSCodeApp";
  const ide = ideHooks.useIDEAppSelector((state) => state.ide);
  const engine = useEngineAppSelector((state) => state.engine);
  const ideDispatch = ideHooks.useIDEAppDispatch();
  const [workspace] = useWorkspaceProps();
  const logger = createLogger("DendronApp");

  logger.info({ ctx, msg: "enter", workspace });
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
    setLogLevel(LOG_LEVEL.INFO);
    // tell vscode that the client is ready
    postVSCodeMessage({
      type: DMessageEnum.INIT,
      data: { src: ctx },
      source: DMessageSource.webClient,
    });
    logger.info({ ctx, msg: "postVSCodeMessage:post" });
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
            sync,
          });
          await ideDispatch(engineSlice.initNotes(workspace));
        }
        if (syncChangedNote && note) {
          // skip the initial ?
          logger.info({
            ctx,
            msg: "syncNote:pre",
            sync,
            note: note ? NoteUtils.toLogObj(note) : "no note",
          });
          await ideDispatch(engineSlice.syncNote({ ...workspace, note }));
        }
        logger.info({ ctx, msg: "setNoteActive:pre" });
        ideDispatch(ideSlice.actions.setNoteActive(note));
        logger.info({ ctx, msg: "setNoteActive:post" });
        break;
      case LookupViewMessageEnum.onUpdate:
        logger.info({ ctx, msg: "refreshLookup:pre" });
        ideDispatch(ideSlice.actions.refreshLookup(msg.data.payload));
        logger.info({ ctx, msg: "refreshLookup:post" });
        break;
      case NoteViewMessageEnum.imagePreviewUrl: {
        logger.info({ ctx, msg: "imagePreviewUrl:pre" });
        ideDispatch(ideSlice.actions.setImageUrl(msg.data.payload));
        logger.info({ ctx, msg: "imagePreviewUrl:post" });
        break;
      }
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

export type DendronAppProps = {
  opts: { padding?: "inherit" };
  Component: DendronComponent;
};

function DendronApp(props: DendronAppProps) {
  const opts = _.defaults(props.opts, { padding: "33px" });

  return (
    <Provider store={combinedStore}>
      <Layout style={{ padding: opts.padding }}>
        <Content>
          <DendronVSCodeApp {...props} />
        </Content>
      </Layout>
    </Provider>
  );
}

export default DendronApp;
