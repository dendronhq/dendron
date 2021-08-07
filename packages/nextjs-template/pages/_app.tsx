import {
  createLogger,
  setLogLevel,
  Provider,
  configureStore,
} from "@dendronhq/common-frontend";
import "antd/dist/antd.css";
import type { AppProps } from "next/app";
import React, { useState } from "react";
import { ThemeSwitcherProvider } from "react-css-theme-switcher";
import DendronLayout from "../components/DendronLayout";
import { combinedStore } from "../features";
import "../styles/scss/main.scss";
import { fetchNotes } from "../utils/fetchers";
import { useDendronRouter } from "../utils/hooks";
import { NoteData } from "../utils/types";

const themes = {
  dark: `/dark-theme.css`,
  light: `/light-theme.css`,
};

function MyApp({ Component, pageProps }: AppProps) {
  const defaultTheme = "light";
  const [noteData, setNoteData] = useState<NoteData>();
  const logger = createLogger("App");
  const dendronRouter = useDendronRouter();

  React.useEffect(() => {
    setLogLevel("INFO");
    logger.info({ ctx: "fetchNotes:pre" });
    fetchNotes().then((data) => {
      logger.info({ ctx: "fetchNotes:got-data" });
      setNoteData(data);
    });
  }, []);

  logger.info({ ctx: "render" });

  return (
    <Provider store={combinedStore}>
      <ThemeSwitcherProvider themeMap={themes} defaultTheme={defaultTheme}>
        <DendronLayout {...noteData} dendronRouter={dendronRouter}>
          <Component
            {...pageProps}
            notes={noteData}
            dendronRouter={dendronRouter}
          />
        </DendronLayout>
      </ThemeSwitcherProvider>
    </Provider>
  );
}
export default MyApp;
