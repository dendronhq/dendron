import React from "react";
import ReactDOM from "react-dom";
import "./index.css";
import reportWebVitals from "./reportWebVitals";
import DendronApp, { DendronAppProps } from "./components/DendronApp";
import { DendronComponent } from "./types";

function renderWithDendronApp(props: DendronAppProps) {
  return <DendronApp {...props} />;
}

/**
 * Render standalone react app
 * @param opts.padding: override default padding
 */
export function renderOnDOM(
  Component: DendronComponent,
  opts: DendronAppProps["opts"]
) {
  ReactDOM.render(
    <React.StrictMode>
      {renderWithDendronApp({ Component, opts })}
    </React.StrictMode>,
    document.getElementById("root")
  );

  // If you want to start measuring performance in your app, pass a function
  // to log results (for example: reportWebVitals(console.log))
  // or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
  reportWebVitals();
}
