var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
import { userActions } from "../redux/reducers/userReducer";
import { Auth } from "@aws-amplify/auth";
import { Logger } from "@aws-amplify/core";
import React from "react";
import { Redirect } from "react-router-dom";
import { connect } from "react-redux";
import styled from "styled-components";
var setAuthState = userActions.setAuthState;
var logger = new Logger("Home");
var mapStateToProps = function (state) { return ({
    value: state.sampleReducer.value,
    loadingState: state.loadingReducer,
    userState: state.userReducer,
}); };
var WindowStyle = styled.div(templateObject_1 || (templateObject_1 = __makeTemplateObject(["\n  margin: auto;\n  min-width: 480px;\n  padding: 10px;\n"], ["\n  margin: auto;\n  min-width: 480px;\n  padding: 10px;\n"])));
// const Home = observer(({ auth }: Props) => {
//   if (auth.authenticated) return <Redirect to="/home" />;
//   auth.logout(true);
//   return null;
// });
var Home = /** @class */ (function (_super) {
    __extends(Home, _super);
    function Home(props) {
        var _this = _super.call(this, props) || this;
        Auth.currentAuthenticatedUser().then(function (user) {
            logger.info({ user: user });
            // optimization because all child components check for a user object
            // fetch here first
            _this.props.dispatch(setAuthState({ authState: "signedIn" }));
        }, function (err) {
            logger.info({ status: "no user" });
        });
        return _this;
    }
    Home.prototype.render = function () {
        var userState = this.props.userState;
        if (userState.authState == "signedIn") {
            return React.createElement(Redirect, { to: "/doc/root" });
        }
        else {
            return React.createElement("div", null, "Redirect Landing");
        }
    };
    return Home;
}(React.PureComponent));
export { Home };
// export function HomeComp() {
//   return <WindowStyle>Loading...</WindowStyle>;
// }
export default connect(mapStateToProps, null, null, {
    forwardRef: true,
})(Home);
var templateObject_1;
//# sourceMappingURL=Home.js.map