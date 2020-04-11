import "./App.css";

import { CReduxComp } from "./sample/ReduxComp";
import { Provider } from "react-redux";
import React from "react";
import logo from "./logo.svg";
import { setupStore } from "./redux";

// === Init Begin {
const store = setupStore();

// } Init End

function App() {
  return (
    <Provider store={store}>
      <div className="App">
        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <CReduxComp />
          <p>
            Edit <code>src/App.tsx</code> and save to reload
          </p>
          <a
            className="App-link"
            href="https://reactjs.org"
            target="_blank"
            rel="noopener noreferrer"
          >
            Learn React
          </a>
        </header>
      </div>
    </Provider>
  );
}

export default App;
