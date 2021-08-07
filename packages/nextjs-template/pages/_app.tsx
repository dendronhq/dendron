import "../styles/scss/main.scss";
import { ThemeSwitcherProvider } from "react-css-theme-switcher";
import type { AppProps } from "next/app";
import DendronLayout from "../components/DendronLayout";
import { fetchNotes } from "../utils/fetchers";
import { useState } from "react";
import { NotePropsDict } from "@dendronhq/common-all";
import React from "react";
import { createLogger, setLogLevel } from "@dendronhq/common-frontend";

const themes = {
  dark: `/dark-theme.css`,
  light: `/light-theme.css`,
};

function MyApp({ Component, pageProps }: AppProps) {
  const defaultTheme = "light";
  const [notes, setNotes] = useState<NotePropsDict>();
  const logger = createLogger("App");

  React.useEffect(() => {
    setLogLevel("INFO");
    logger.info({ ctx: "fetchNotes:pre" });
    fetchNotes().then((data) => {
      logger.info({ ctx: "fetchNotes:got-data" });
      setNotes(data.notes);
    });
  }, []);

  logger.info({ ctx: "render" });

  return (
    <ThemeSwitcherProvider themeMap={themes} defaultTheme={defaultTheme}>
      <DendronLayout>
        <Component {...pageProps} notes={notes} />
      </DendronLayout>
    </ThemeSwitcherProvider>
  );
}
export default MyApp;
