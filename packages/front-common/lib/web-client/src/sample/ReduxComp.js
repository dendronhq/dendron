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
import React from "react";
import { connect } from "react-redux";
import { loadingActions } from "../redux/reducers/loadingReducer";
import { sampleActions } from "../redux/reducers/sampleReducer";
// const { setActiveNodeId } = nodeActions;
// const { } = userActions;
var setLoadingState = loadingActions.setLoadingState;
// const { queryOne, getNode } = nodeEffects;
var mapStateToProps = function (state) { return ({
    userState: state.userReducer,
    loadingState: state.loadingReducer,
    value: state.sampleReducer.value,
}); };
sampleActions.setValue({ value: 5 });
function ReduxComp(props) {
    console.log(props);
    return React.createElement("div", null,
        " ReduxComp value: ",
        props.value);
}
var ReduxPureComp = /** @class */ (function (_super) {
    __extends(ReduxPureComp, _super);
    function ReduxPureComp() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    ReduxPureComp.prototype.loadingExample = function () {
        var dispatch = this.props.dispatch;
        dispatch(setLoadingState({ key: "FETCHING_INIT", value: true }));
        // do action
        dispatch(setLoadingState({ key: "FETCHING_INIT", value: false }));
    };
    ReduxPureComp.prototype.render = function () {
        var loadingState = this.props.loadingState;
        if (loadingState.FETCHING_INIT) {
            return "Loading...";
        }
        return React.createElement("div", null, " ");
    };
    return ReduxPureComp;
}(React.PureComponent));
export { ReduxPureComp };
export default connect(mapStateToProps, null, null, {
    forwardRef: true,
})(ReduxComp);
//# sourceMappingURL=ReduxComp.js.map