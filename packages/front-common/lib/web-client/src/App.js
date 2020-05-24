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
var logger = new Logger("App");
// === Init Start {
var store = setupStore();
Amplify.Logger.LOG_LEVEL = "DEBUG";
var authConfig = Auth.configure(awsconfig.Auth);
logger.info({ currentConfig: authConfig });
// } Init End
function AppSwitch() {
    return (React.createElement(Switch, null,
        React.createElement(Route, { exact: true, path: "/", component: Home }),
        React.createElement(Route, { exact: true, path: "/doc/:id", component: KeyedPane }),
        React.createElement(Route, { exact: true, path: "/test1", component: Test })));
}
function App() {
    // <Router history={getOrCreateHistory() as any}></Router>
    return (React.createElement(Provider, { store: store },
        React.createElement(BrowserRouter, null,
            React.createElement(DendronLayout, null,
                React.createElement(AppSwitch, null)))));
}
export default withAuthenticator(App);
//# sourceMappingURL=App.js.map