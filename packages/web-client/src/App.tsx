import "./App.css";

import { Route, Router, Switch } from "react-router-dom";

import Amplify from "@aws-amplify/core";
import { CReduxComp } from "./sample/ReduxComp";
import { CSider } from "./nav/Sider";
import { DIVIDER_COLOR } from "./config";
import { ErrorBoundary } from "./base/ErrorBoundary";
import { HomeComp } from "./components/Home";
import { Layout } from "antd";
import { Provider } from "react-redux";
import React from "react";
import { TopBarComponent } from "./nav/TopBar";
import { getOrCreateHistory } from "./utils/history";
import { setupStore } from "./redux";
import styled from "styled-components";

const { Content, Sider, Footer } = Layout;
// === Init Start {
const store = setupStore();
Amplify.Logger.LOG_LEVEL = "DEBUG";

// } Init End

function AppSwitch() {
  return (
    <Switch>
      <Route exact path="/" component={HomeComp} />
      <Route exact path="/test1" component={CReduxComp} />
    </Switch>
  );
}
const SSider = styled(Sider)`
  border-right: 3px solid ${DIVIDER_COLOR};
`;

const SContent = styled(Content)`
  background-color: white;
`;

function App() {
  return (
    <Provider store={store}>
      <Router history={getOrCreateHistory() as any}>
        <Layout>
          <ErrorBoundary>
            <TopBarComponent />
            <Layout>
              <SSider theme="light">
                <CSider />
              </SSider>
              <SContent>
                <AppSwitch></AppSwitch>
              </SContent>
            </Layout>
          </ErrorBoundary>
          <Footer>Footer</Footer>
        </Layout>
      </Router>
    </Provider>
  );
}

export default App;
