import {
  batch,
  createLogger,
  Provider,
  setLogLevel
} from "@dendronhq/common-frontend";
import "antd/dist/antd.css";
import type { AppProps } from "next/app";
import React, { useState } from "react";
import { ThemeSwitcherProvider } from "react-css-theme-switcher";
import DendronLayout from "../components/DendronLayout";
import { combinedStore, useCombinedDispatch } from "../features";
import { browserEngineSlice } from "../features/engine";
import "../public/light-theme.css";
import "../styles/scss/main.scss";
import { fetchConfig, fetchNotes } from "../utils/fetchers";
import { useDendronRouter } from "../utils/hooks";
import { NoteData } from "../utils/types";

const themes = {
  dark: `/dark-theme.css`,
  light: `/light-theme.css`,
};

function AppContainer({ Component, pageProps, router }: AppProps) {
  const defaultTheme = "light";
  return (
    <Provider store={combinedStore}>
      <ThemeSwitcherProvider themeMap={themes} defaultTheme={defaultTheme}>
        <DendronApp
          Component={Component}
          pageProps={pageProps}
          router={router}
        />
      </ThemeSwitcherProvider>
    </Provider>
  );
}

function DendronApp({ Component, pageProps }: AppProps) {
  const [noteData, setNoteData] = useState<NoteData>();
  const logger = createLogger("App");
  const dendronRouter = useDendronRouter();
  const dispatch = useCombinedDispatch();

  React.useEffect(() => {
    setLogLevel("INFO");
    logger.info({ ctx: "fetchNotes:pre" });
    fetchNotes().then((data) => {
      logger.info({ ctx: "fetchNotes:got-data" });
      setNoteData(data);
      batch(() => {
        dispatch(browserEngineSlice.actions.setNotes(data.notes));
        dispatch(browserEngineSlice.actions.setNoteIndex(data.noteIndex));
      });
    });
    fetchConfig().then((data) => {
      logger.info({ ctx: "fetchConfig:got-data" });
      dispatch(browserEngineSlice.actions.setConfig(data));
    });
  }, []);

  logger.info({ ctx: "render" });

  return (
    <DendronLayout {...noteData} dendronRouter={dendronRouter}>
      <Component
        {...pageProps}
        notes={noteData}
        dendronRouter={dendronRouter}
      />
    </DendronLayout>
  );
}

export default AppContainer;
