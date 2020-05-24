import "./App.css";

import { BrowserRouter, Route, Switch } from "react-router-dom";

import Amplify from "@aws-amplify/core";
import Auth from "@aws-amplify/auth";
import DendronLayout from "./components/DendronLayout";
import Home from "./components/Home";
import KeyedPane from "./editor/KeyedPane";
import { Logger } from "@aws-amplify/core";
import { Provider } from "react-redux";
import React from "react";
import Test from "./test";
import awsconfig from "./aws-exports";
import { setupStore } from "./redux";
import { withAuthenticator } from "@aws-amplify/ui-react";

const logger = new Logger("App");

// === Init Start {
const store = setupStore();
export type AppDispatch = typeof store.dispatch;

Amplify.Logger.LOG_LEVEL = "DEBUG";
const authConfig = Auth.configure(awsconfig.Auth);
logger.info({ currentConfig: authConfig });

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

export default withAuthenticator(App);
