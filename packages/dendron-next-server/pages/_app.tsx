import {
  DMessageSource,
  DMessageType,
  OnDidChangeActiveTextEditorMsg,
  ThemeMessageType,
} from "@dendronhq/common-all";
import {
  combinedStore,
  createLogger,
  engineHooks,
  engineSlice,
  ideHooks,
  ideSlice,
  postVSCodeMessage,
  querystring,
  setLogLevel,
  useVSCodeMessage,
} from "@dendronhq/common-frontend";
import { Spin } from "antd";
import { useRouter } from "next/router";
import React, { useEffect } from "react";
import { ThemeSwitcherProvider } from "react-css-theme-switcher";
import { Provider } from "react-redux";
import Layout from "../components/layout";
import NoOp from "../components/NoOp";
import PreviewHeader from "../components/PreviewHeader";
import "../styles/scss/main.scss";

const themes = {
  dark: `/dark-theme.css`,
  light: `/light-theme.css`,
};

const { useEngineAppSelector, useEngine } = engineHooks;

function AppVSCode({ Component, pageProps }: any) {
  // --- init
  const router = useRouter();
  const { query, isReady } = router;
  const ide = ideHooks.useIDEAppSelector((state) => state.ide);
  const engine = useEngineAppSelector((state) => state.engine);
  const ideDispatch = ideHooks.useIDEAppDispatch();

  useEffect(() => {
    setLogLevel("INFO");
    // get variables from vscode parent
    postVSCodeMessage({
      type: DMessageType.init,
      data: {},
      source: DMessageSource.webClient,
    });
  }, []);
  useEngine({ engineState: engine, opts: query });
  const logger = createLogger("AppVSCode");
  logger.info({ state: "enter!", query });

  // --- effects
  // listen to vscode events
  useVSCodeMessage(async (msg) => {
    const ctx = "useVSCodeMsg";
    const { query } = router;
    // when we get a msg from vscode, update our msg state
    logger.info({ ctx, msg, query });

    if (msg.type === "onDidChangeActiveTextEditor") {
      let cmsg = msg as OnDidChangeActiveTextEditorMsg;
      const { sync, note } = cmsg.data;
      if (sync) {
        // skip the initial ?
        const { port, ws } = querystring.parse(
          window.location.search.slice(1)
        ) as { port: string; ws: string };
        logger.info({
          ctx,
          msg: "syncEngine:pre",
          port,
          ws,
        });
        await ideDispatch(
          engineSlice.initNotes({ port: parseInt(port as string), ws })
        );
      }
      logger.info({ ctx, msg: "syncEngine:post" });
      ideDispatch(ideSlice.actions.setNoteActive(note));
      logger.info({ ctx, msg: "setNote:post" });
    } else if (msg.type === ThemeMessageType.onThemeChange) {
      let cmsg = msg;
      const { theme } = cmsg.data;
      logger.info({ ctx, theme, msg: "theme" });
      ideDispatch(ideSlice.actions.setTheme(theme));
    } else {
      logger.error({ ctx, msg: "unknown message" });
    }
  });

  // --- render
  if (!isReady) {
    logger.info({ ctx: "exit", state: "router:notInitialized" });
    return <Spin />;
  }
  logger.info({ ctx: "exit", state: "render:child", engine, ide });
  let defaultTheme = "light";
  if (ide.theme !== "unknown") {
    defaultTheme = ide.theme;
  }
  const Header = router.pathname.startsWith("/vscode/note-preview")
    ? PreviewHeader
    : NoOp;
  return (
    <ThemeSwitcherProvider themeMap={themes} defaultTheme={defaultTheme}>
      <Header />
      <Component engine={engine} ide={ide} {...pageProps} />
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
