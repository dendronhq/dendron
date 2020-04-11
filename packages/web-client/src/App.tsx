import "./App.css";

import { Route, Router, Switch } from "react-router-dom";

import { CReduxComp } from "./sample/ReduxComp";
import { Provider } from "react-redux";
import React from "react";
import { getOrCreateHistory } from "./utils/history";
import logo from "./logo.svg";
import { setupStore } from "./redux";

// === Init Begin {
const store = setupStore();

// } Init End

function DummyComp() {
  return <div>DummyComp</div>;
}

function AppSwitch() {
  return (
    <Switch>
      <Route exact path="/test1" component={CReduxComp} />
      <Route exact path="/test2" component={DummyComp} />
    </Switch>
  );
}

function App() {
  return (
    <Provider store={store}>
      <Router history={getOrCreateHistory() as any}>
        <AppSwitch></AppSwitch>
      </Router>
    </Provider>
  );
}

export default App;
