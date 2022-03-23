import {
  DMessageSource,
  DMessageEnum,
  OnDidChangeActiveTextEditorMsg,
  SeedBrowserMessageType,
  ThemeMessageType,
} from "@dendronhq/common-all";
import {
  combinedStore,
  createLogger,
  engineHooks,
  engineSlice,
  ideHooks,
  ideSlice,
  LOG_LEVEL,
  postVSCodeMessage,
  querystring,
  setLogLevel,
  useVSCodeMessage,
} from "@dendronhq/common-frontend";
import { Spin } from "antd";
import _ from "lodash";
import { useRouter } from "next/router";
import React, { useEffect } from "react";
import { ThemeSwitcherProvider } from "react-css-theme-switcher";
import { Provider } from "react-redux";
import Layout from "../components/layout";
import NoOp from "../components/NoOp";
import PreviewHeader from "../components/PreviewHeader";
import { WorkspaceProps } from "../lib/types";
import "../styles/scss/main.scss";

const themes = {
  dark: `/dark-theme.css`,
  light: `/light-theme.css`,
};

const { useEngineAppSelector, useEngine } = engineHooks;

const getWorkspaceParamsFromQueryString = (): WorkspaceProps => {
  const { port, ws, theme, browser } = querystring.parse(
    window.location.search.slice(1)
  );
  return {
    port: parseInt(port as string, 10),
    ws,
    theme,
    browser,
  } as WorkspaceProps;
};

function AppVSCode({ Component, pageProps }: any) {
  // === Init
  const router = useRouter();
  const { query, isReady } = router;
  const ide = ideHooks.useIDEAppSelector((state) => state.ide);
  const engine = useEngineAppSelector((state) => state.engine);
  const ideDispatch = ideHooks.useIDEAppDispatch();
  const [workspaceOpts, setWorkspaceOpts] = React.useState<WorkspaceProps>();

  const logger = createLogger("AppVSCode");
  logger.info({ state: "enter", query });

  // === Hooks
  // run once
  useEffect(() => {
    setLogLevel(LOG_LEVEL.INFO);
    // get variables from vscode parent
    postVSCodeMessage({
      type: DMessageEnum.INIT,
      data: {},
      source: DMessageSource.webClient,
    });
    // set initial query params
    const out = getWorkspaceParamsFromQueryString();
    setWorkspaceOpts(out);
    logger.info("AppVSCode.init");
  }, []);

  useEngine({ engineState: engine, opts: query });

  // --- effects
  // listen to vscode events
  useVSCodeMessage(async (msg) => {
    const ctx = "useVSCodeMsg";
    const { query } = router;
    // when we get a msg from vscode, update our msg state
    logger.info({ ctx, msg, query });
    // NOTE: initial message, state might not be set
    const { port, ws } = getWorkspaceParamsFromQueryString();

    if (msg.type === DMessageEnum.ON_DID_CHANGE_ACTIVE_TEXT_EDITOR) {
      const cmsg = msg as OnDidChangeActiveTextEditorMsg;
      const { sync, note, syncChangedNote, activeNote } = cmsg.data;
      if (sync) {
        // skip the initial ?
        logger.info({
          ctx,
          msg: "syncEngine:pre",
          port,
          ws,
        });
        await ideDispatch(engineSlice.initNotes({ port, ws }));
      }
      if (syncChangedNote && note) {
        await ideDispatch(engineSlice.syncNote({ port, ws, note }));
      }
      logger.info({ ctx, msg: "syncEngine:post" });
      logger.info({ ctx, msg: "setNoteActive:pre" });
      // If activeNote is in the data payload, set that as active note. Otherwise default to changed note
      const noteToSetActive = activeNote || note;
      ideDispatch(ideSlice.actions.setNoteActive(noteToSetActive));
      logger.info({ ctx, msg: "setNoteActive:post" });
    } else if (msg.type === ThemeMessageType.onThemeChange) {
      const cmsg = msg;
      const { theme } = cmsg.data;
      logger.info({ ctx, theme, msg: "theme" });
      ideDispatch(ideSlice.actions.setTheme(theme));
    } else if (msg.type === "onGraphStyleLoad") {
      const cmsg = msg;
      const { styles } = cmsg.data;
      logger.info({ ctx, styles, msg: "styles" });
      ideDispatch(ideSlice.actions.setGraphStyles(styles));
    } else if (msg.type === SeedBrowserMessageType.onSeedStateChange) {
      const seeds = msg.data.msg;
      logger.info({ ctx, seeds, msg: "seeds" });
      ideDispatch(ideSlice.actions.setSeedsInWorkspace(seeds));
    } else {
      logger.error({ ctx, msg: "unknown message" });
    }
  });

  // === Render
  // Don't load children until all following conditions true
  if (
    !workspaceOpts?.browser &&
    _.some([_.isUndefined(workspaceOpts), ide.theme === "unknown", !isReady])
  ) {
    return <Spin />;
  }

  let defaultTheme = workspaceOpts?.theme || "dark";
  if (ide.theme !== "unknown") {
    defaultTheme = ide.theme;
  }
  const Header = router.pathname.startsWith("/vscode/note-preview")
    ? PreviewHeader
    : NoOp;

  logger.info({ ctx: "exit", state: "render:child" });
  return (
    <ThemeSwitcherProvider themeMap={themes} defaultTheme={defaultTheme}>
      <Header engine={engine} ide={ide} {...pageProps} />
      <Component engine={engine} ide={ide} {...pageProps} {...workspaceOpts} />
    </ThemeSwitcherProvider>
  );
}

function App({ Component, pageProps }: any) {
  // TODO: temporary as we're refactoring some things
  const router = useRouter();
  if (router.pathname.startsWith("/vscode")) {
    return (
      <Provider store={combinedStore}>
        <AppVSCode Component={Component} pageProps={pageProps} />
      </Provider>
    );
  }
  return (
    <Layout>
      <Component {...pageProps} />
    </Layout>
  );
}

export default App;
