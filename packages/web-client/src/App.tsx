import "./App.css";

import { Route, Router, Switch } from "react-router-dom";

import { CReduxComp } from "./sample/ReduxComp";
import { CSider } from "./nav/Sider";
import { ErrorBoundary } from "./base/ErrorBoundary";
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

// } Init End

function DummyComp() {
  return <div>DummyComp</div>;
}

function AppSwitch() {
  return (
    <Switch>
      <Route exact path="/" component={DummyComp} />
      <Route exact path="/test1" component={CReduxComp} />
      <Route exact path="/test2" component={DummyComp} />
    </Switch>
  );
}
const SSider = styled(Sider)``;

const SContent = styled(Content)`
  background: green;
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
