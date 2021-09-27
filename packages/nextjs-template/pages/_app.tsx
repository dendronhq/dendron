import {
  batch,
  createLogger,
  Provider,
  setLogLevel,
} from "@dendronhq/common-frontend";
import "antd/dist/antd.css";
import { NextPage } from "next";
import type { AppProps } from "next/app";
import { ReactElement, useEffect, useState } from "react";
import { ThemeSwitcherProvider } from "react-css-theme-switcher";
import { useDendronGATracking } from "../components/DendronGATracking";
import { combinedStore, useCombinedDispatch } from "../features";
import { browserEngineSlice } from "../features/engine";
import "../public/light-theme.css";
import "../styles/scss/main.scss";
import { fetchConfig, fetchNotes } from "../utils/fetchers";
import { useDendronRouter } from "../utils/hooks";
import { getAssetUrl } from "../utils/links";
import { NoteData } from "../utils/types";

const themes = {
  dark: getAssetUrl(`/dark-theme.css`),
  light: getAssetUrl(`/light-theme.css`),
};

function AppContainer(appProps: AppPropsWithLayout) {
  const defaultTheme = "light";
  return (
    <Provider store={combinedStore}>
      <ThemeSwitcherProvider themeMap={themes} defaultTheme={defaultTheme}>
        <DendronApp {...appProps} />
      </ThemeSwitcherProvider>
    </Provider>
  );
}

type NextPageWithLayout = NextPage & {
  getLayout?: (page: ReactElement, props: any) => ReactElement
}

type AppPropsWithLayout = AppProps & {
  Component: NextPageWithLayout
}


function DendronApp({ Component, pageProps }: AppPropsWithLayout) {
  const [noteData, setNoteData] = useState<NoteData>();
  const logger = createLogger("App");
  const dendronRouter = useDendronRouter();
  const dispatch = useCombinedDispatch();
  useDendronGATracking();

  useEffect(() => {
    (async () => {
      setLogLevel("INFO");
      logger.info({ ctx: "fetchNotes:pre" });
      const data = await fetchNotes();
      logger.info({ ctx: "fetchNotes:got-data" });
      setNoteData(data);
      batch(() => {
        dispatch(browserEngineSlice.actions.setNotes(data.notes));
        dispatch(browserEngineSlice.actions.setNoteIndex(data.noteIndex));
      });
      const config = await fetchConfig();
      logger.info({ ctx: "fetchConfig:got-data" });
      dispatch(browserEngineSlice.actions.setConfig(config));
    })();
  }, []);

  logger.info({ ctx: "render" });
  const getLayout = Component.getLayout ?? ((page) => page)
  return getLayout(
    <Component {...pageProps} notes={noteData} dendronRouter={dendronRouter} />,
    {
      ...noteData,
      dendronRouter,
    }
  );
}

export default AppContainer;
