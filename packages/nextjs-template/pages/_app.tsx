import {
  batch,
  createLogger,
  Provider,
  setLogLevel,
} from "@dendronhq/common-frontend";
import "antd/dist/antd.css";
import type { AppProps } from "next/app";
import { useEffect, useState } from "react";
import { ThemeSwitcherProvider } from "react-css-theme-switcher";
import { useDendronGATracking } from "../components/DendronGATracking";
import DendronLayout from "../components/DendronLayout";
import { combinedStore, useCombinedDispatch } from "../features";
import { browserEngineSlice } from "../features/engine";
import "../public/assets-dendron/css/light.css";
import "../styles/scss/main.scss";
import { fetchConfig, fetchNotes } from "../utils/fetchers";
import { useDendronRouter } from "../utils/hooks";
import { getAssetUrl } from "../utils/links";
import { NoteData } from "../utils/types";
import Head from "next/head";
import { getLogLevel } from "../utils/etc";

const themes = {
  dark: getAssetUrl(`/assets-dendron/css/dark.css`),
  light: getAssetUrl(`/assets-dendron/css/light.css`),
};

function AppContainer(appProps: AppProps) {
  const defaultTheme = "light";
  return (
    <Provider store={combinedStore}>
      <ThemeSwitcherProvider themeMap={themes} defaultTheme={defaultTheme}>
        <DendronApp {...appProps} />
      </ThemeSwitcherProvider>
    </Provider>
  );
}

function DendronApp({ Component, pageProps }: AppProps) {
  const [noteData, setNoteData] = useState<NoteData>();
  const logger = createLogger("App");
  const dendronRouter = useDendronRouter();
  const dispatch = useCombinedDispatch();
  useDendronGATracking();

  useEffect(() => {
    (async () => {
      const logLevel = getLogLevel();
      setLogLevel(logLevel);
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

  return (
    <DendronLayout {...noteData} dendronRouter={dendronRouter}>
      <Head>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Component
        {...pageProps}
        notes={noteData}
        dendronRouter={dendronRouter}
      />
    </DendronLayout>
  );
}

export default AppContainer;
