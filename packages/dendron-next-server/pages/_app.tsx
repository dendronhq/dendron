import { OnDidChangeActiveTextEditorMsg } from "@dendronhq/common-all";
import {
  combinedStore, createLogger,
  engineHooks,
  engineSlice,


  ideHooks, ideSlice,



  querystring, setLogLevel,
  useVSCodeMessage
} from "@dendronhq/common-frontend";
import { useRouter } from "next/router";
import React, { useEffect } from "react";
import { ThemeSwitcherProvider } from "react-css-theme-switcher";
import { Provider } from "react-redux";
import Layout from "../components/layout";

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
  const dispatch = ideHooks.useIDEAppDispatch();
  // set logging
  useEffect(() => {
    setLogLevel("INFO");
  });
  useEngine({ engineState: engine, opts: query });
  const logger = createLogger("AppVSCode");
  logger.info({ state: "enter", query });

  // --- effects
  // listen to vscode events
  useVSCodeMessage(async (msg) => {
    const ctx = "useVSCodeMsg";
    const { query } = router;
    // when we get a msg from vscode, update our msg state
    logger.info({ ctx, msg, query});

    if (msg.type === "onDidChangeActiveTextEditor") {
      let cmsg = msg as OnDidChangeActiveTextEditorMsg;
      const {sync, note} = cmsg.data;
      if (sync) {
        // skip the initial ?
        const {port, ws} = querystring.parse(window.location.search.slice(1)) as {port: string, ws: string}
        logger.info({
          ctx,
          msg: "syncEngine:pre",
          port, ws
        })
        await dispatch(engineSlice.initNotes({ port: parseInt(port as string), ws}));
      }
      logger.info({ ctx, msg: "syncEngine:post"});
      dispatch(ideSlice.actions.setNoteActive(note));
      logger.info({ ctx, msg: "setNote:post"});
    } else {
      logger.error({ctx, msg: "unknown message"});
    }
  });

  // --- render
  if (!isReady) {
    logger.info({ ctx: "exit", state: "router:notInitialized"});
    return <> </>;
  }
  logger.info({ ctx: "exit", state: "render:child", engine, ide});
  return <Component engine={engine} ide={ide} {...pageProps} />;
}

function App({ Component, pageProps }: any) {
  // TODO: temporary as we're refactoring some things
  const router = useRouter();
  if (router.pathname.startsWith("/vscode")) {
    return (
      <ThemeSwitcherProvider themeMap={themes} defaultTheme="dark">
        <Provider store={combinedStore}>
          <AppVSCode Component={Component} pageProps={pageProps} />
        </Provider>
      </ThemeSwitcherProvider>
    );
  }
  return (
    <Layout>
      <Component {...pageProps} />
    </Layout>
  );
}

export default App;
