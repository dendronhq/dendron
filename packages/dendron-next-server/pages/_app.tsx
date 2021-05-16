import { createLogger, engineHooks, engineSlice, engineStore, setLogLevel } from "@dendronhq/common-frontend";
import { useRouter } from 'next/router';
import React, { useEffect } from "react";
import { Provider } from "react-redux";
import Layout from "../components/layout";


const {useEngineAppSelector, useEngine} = engineHooks;
const {EngineSliceUtils} = engineSlice;

function AppVSCode({ Component, pageProps }) {
  const router = useRouter();
  const {query, isReady} = router;
  useEffect(() => {
    setLogLevel("INFO");
  });
  const engine = useEngineAppSelector((state) => state.engine);
  useEngine({ engine, opts: query });
  if (!isReady) {
    return <> </>
  }
  const logger = createLogger("AppVSCode");
  logger.info({ctx: "enter", query});
  if (!EngineSliceUtils.hasInitialized(engine)) {
    return null;
  }
  return <Component engine={engine} {...pageProps} />
  
}

function App({ Component, pageProps }) {
  // TODO: temporary as we're refactoring some things
  const router = useRouter()
  if (router.pathname.startsWith("/vscode")) {
      return <Provider store={engineStore}>
      <AppVSCode Component={Component} pageProps={pageProps} />
      </Provider>
  }
  return (
    <Layout>
      <Component {...pageProps} />
    </Layout>
  );
}

export default App;
