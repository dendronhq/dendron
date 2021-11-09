import { NotePropsDict } from "@dendronhq/common-all";
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
import "../public/light-theme.css";
import "../styles/scss/main.scss";
import { fetchConfig, fetchNotes, fetchSections } from "../utils/fetchers";
import { useDendronRouter } from "../utils/hooks";
import { getAssetUrl } from "../utils/links";
import { NoteData, SectionsData } from "../utils/types";

const themes = {
  dark: getAssetUrl(`/dark-theme.css`),
  light: getAssetUrl(`/light-theme.css`),
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
  const [noteData, setNoteData] = useState<SectionsData>();
  const logger = createLogger("App");
  const dendronRouter = useDendronRouter();
  const dispatch = useCombinedDispatch();
  useDendronGATracking();

  useEffect(() => {
    (async () => {
      setLogLevel("INFO");
      logger.info({ ctx: "fetchNotes:pre" });
      // Every time a new page is rendered this logic is executed.
      const data = await fetchSections();
      logger.info({ ctx: "fetchNotes:got-data" });
      console.log(data);
      setNoteData(data);
      // batch(() => {
      //   dispatch(browserEngineSlice.actions.setNotes(data.notes));
      //   dispatch(browserEngineSlice.actions.setNoteIndex(data.noteIndex));
      // });
      const config = await fetchConfig();
      logger.info({ ctx: "fetchConfig:got-data" });
      dispatch(browserEngineSlice.actions.setConfig(config));
    })();
  }, []);

  logger.info({ ctx: "render" });
  console.log(noteData);
  if (!noteData) {
    return <span>loading</span>;
  }
  return (
    <DendronLayout notes={noteData}>
      <Component
        {...pageProps}
        notes={noteData}
        dendronRouter={dendronRouter}
      />
    </DendronLayout>
  );
}

export default AppContainer;
