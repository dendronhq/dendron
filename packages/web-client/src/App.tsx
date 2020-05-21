import "./App.css";

import { BrowserRouter, Route, Switch } from "react-router-dom";

import Amplify from "@aws-amplify/core";
import DendronLayout from "./components/DendronLayout";
import Home from "./components/Home";
import KeyedPane from "./editor/KeyedPane";
import { Provider } from "react-redux";
import React from "react";
import Test from "./test";
import awsconfig from "./aws-exports";
import { setupStore } from "./redux";

// === Init Start {
const store = setupStore();
export type AppDispatch = typeof store.dispatch;

Amplify.Logger.LOG_LEVEL = "DEBUG";
Amplify.configure(awsconfig);

// } Init End

function AppSwitch() {
  return (
    <Switch>
      <Route exact path="/" component={Home} />
      <Route exact path="/doc/:id" component={KeyedPane} />
      <Route exact path="/test1" component={Test} />
    </Switch>
  );
}

function App() {
  // <Router history={getOrCreateHistory() as any}></Router>
  return (
    <Provider store={store}>
      <BrowserRouter>
        <DendronLayout>
          <AppSwitch />
        </DendronLayout>
      </BrowserRouter>
    </Provider>
  );
}

export default App;
