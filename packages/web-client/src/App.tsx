import "./App.css";

import { Route, Router, Switch } from "react-router-dom";

import Amplify from "@aws-amplify/core";
import { CReduxComp } from "./sample/ReduxComp";
import DendronLayout from "./components/DendronLayout";
import { HomeComp } from "./components/Home";
import KeyedPane from "./editor/KeyedPane";
import { Provider } from "react-redux";
import React from "react";
import { getOrCreateHistory } from "./utils/history";
import { setupStore } from "./redux";

// === Init Start {
const store = setupStore();
export type AppDispatch = typeof store.dispatch;

Amplify.Logger.LOG_LEVEL = "DEBUG";

// } Init End

function AppSwitch() {
  return (
    <Switch>
      <Route exact path="/" component={HomeComp} />
      <Route exact path="/doc/:id" component={KeyedPane} />
      <Route exact path="/test1" component={CReduxComp} />
    </Switch>
  );
}

function App() {
  return (
    <Provider store={store}>
      <Router history={getOrCreateHistory() as any}>
        <DendronLayout>
          <AppSwitch />
        </DendronLayout>
      </Router>
    </Provider>
  );
}

export default App;
