import React from "react";
import ReactDOM from "react-dom";
import "./index.css";
import reportWebVitals from "./reportWebVitals";
import DendronApp from "./components/DendronApp";
import DendronNotePage from "./components/DendronNotePage";
import { DendronComponent } from "./types";

function renderWithDendronApp(
  props: { Component: DendronComponent }
) {
  return <DendronApp {...props} />;
}

/**
 * Render standalone react app
 * @param props 
 */
export function renderOnDOM(Component: DendronComponent) {
  ReactDOM.render(
    <React.StrictMode>
      {renderWithDendronApp({Component})}
    </React.StrictMode>,
    document.getElementById("root")
  );

  // If you want to start measuring performance in your app, pass a function
  // to log results (for example: reportWebVitals(console.log))
  // or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
  reportWebVitals();
}
