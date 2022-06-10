import {
  DMessageEnum,
  DMessageSource,
  GraphThemeEnum,
  GraphViewMessageEnum,
  LookupViewMessageEnum,
  NoteUtils,
  OnDidChangeActiveTextEditorMsg,
  SeedBrowserMessageType,
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
import { Layout } from "antd";
import React from "react";
import { useWorkspaceProps } from "../hooks";
import "../styles/scss/main.scss";
import { DendronComponent } from "../types";
import { postVSCodeMessage, useVSCodeMessage } from "../utils/vscode";
const { Content } = Layout;

const { useEngineAppSelector } = engineHooks;

function DendronVSCodeApp({ Component }: { Component: DendronComponent }) {
  const ctx = "DendronVSCodeApp";
  const ide = ideHooks.useIDEAppSelector((state) => state.ide);
  const engine = useEngineAppSelector((state) => state.engine);
  const ideDispatch = ideHooks.useIDEAppDispatch();
  const [workspace] = useWorkspaceProps();
  const logger = createLogger("DendronApp");

  logger.info({ ctx, msg: "enter", workspace });

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
      // TODO: Handle case where note is deleted. This should be implemented after we implement new message type to denote note state changes
      case DMessageEnum.ON_DID_CHANGE_ACTIVE_TEXT_EDITOR:
        const cmsg = msg as OnDidChangeActiveTextEditorMsg;
        const { sync, note, syncChangedNote, activeNote } = cmsg.data;
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
        // If activeNote is in the data payload, set that as active note. Otherwise default to changed note
        const noteToSetActive = activeNote ? activeNote : note;
        ideDispatch(ideSlice.actions.setNoteActive(noteToSetActive));
        logger.info({ ctx, msg: "setNoteActive:post" });
        break;
      case LookupViewMessageEnum.onUpdate:
        logger.info({ ctx, msg: "refreshLookup:pre" });
        ideDispatch(ideSlice.actions.refreshLookup(msg.data.payload));
        logger.info({ ctx, msg: "refreshLookup:post" });
        break;
      case GraphViewMessageEnum.onGraphOptsLoad: {
        const cmsg = msg;
        const { styles, graphTheme, graphDepth } = cmsg.data;
        logger.info({ ctx, styles, msg: "styles" });
        if (styles) {
          ideDispatch(ideSlice.actions.setGraphStyles(styles));
        }
        if (graphTheme) {
          logger.info({ ctx, graphTheme, msg: "default graph theme" });
          ideDispatch(ideSlice.actions.setGraphTheme(graphTheme));
        }
        if (!graphTheme && styles) {
          ideDispatch(ideSlice.actions.setGraphTheme(GraphThemeEnum.Custom));
        }
        if (graphDepth) {
          logger.info({ ctx, graphDepth, msg: "default graph depth" });
          ideDispatch(ideSlice.actions.setGraphDepth(graphDepth));
        }
        break;
      }
      case SeedBrowserMessageType.onSeedStateChange: {
        const seeds = msg.data.msg;
        logger.info({ ctx, seeds, msg: "seeds" });
        ideDispatch(ideSlice.actions.setSeedsInWorkspace(seeds));
        break;
      }
      default:
        logger.error({ ctx, msg: "unknown message", payload: msg });
        break;
    }
  });

  return <Component {...props} />;
}

export type DendronAppProps = {
  opts: { padding: "inherit" | number | string };
  Component: DendronComponent;
};

function DendronApp(props: DendronAppProps) {
  return (
    <Provider store={combinedStore}>
      <Layout style={{ padding: props.opts.padding }}>
        <Content>
          <DendronVSCodeApp {...props} />
        </Content>
      </Layout>
    </Provider>
  );
}

export default DendronApp;
