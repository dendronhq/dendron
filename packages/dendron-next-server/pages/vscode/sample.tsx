import { createLogger, engineSlice } from "@dendronhq/common-frontend";
import { useThemeSwitcher } from "react-css-theme-switcher";
import _ from "lodash";
import React from "react";
import { Button } from "antd";
import { DendronProps } from "../../lib/types";

export default function Sample({ engine }: DendronProps) {
  const notes = engine.notes;
  const logger = createLogger("Sample");
  const { switcher, themes, currentTheme, status } = useThemeSwitcher();
  const [_isDarkMode, setIsDarkMode] = React.useState(false);

  if (status === "loading") {
    return <div>Loading styles...</div>;
  }

  const toggleDarkMode = () => {
    setIsDarkMode((previous) => {
      switcher({ theme: previous ? themes.light : themes.dark });
      return !previous;
    });
  };

  return (
    <>
      <h4>Current theme: {currentTheme}</h4>
      <Button type="primary" onClick={toggleDarkMode}>
        Toggle Theme
      </Button>
      <br />
      Notes:{" "}
      {_.values(notes)
        .map((n) => n.fname)
        .join(", ")}
    </>
  );
}
