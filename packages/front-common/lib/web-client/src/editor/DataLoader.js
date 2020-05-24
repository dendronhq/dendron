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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
import { nodeActions, nodeEffects } from "../redux/reducers/nodeReducer";
import { Logger } from "@aws-amplify/core";
import Pane from "./Pane";
import React from "react";
import { connect } from "react-redux";
import { loadingActions } from "../redux/reducers/loadingReducer";
import { withRouter } from "react-router-dom";
var getNode = nodeEffects.getNode, getAllStubs = nodeEffects.getAllStubs;
var setActiveNodeId = nodeActions.setActiveNodeId;
var setLoadingState = loadingActions.setLoadingState;
var logger = new Logger("DataLoader");
var mapStateToProps = function (_state) { return ({
    nodeState: _state.nodeReducer,
    loadState: _state.loadingReducer,
}); };
var DataLoader = /** @class */ (function (_super) {
    __extends(DataLoader, _super);
    function DataLoader(props) {
        var _this = _super.call(this, props) || this;
        _this.loadNode = function () {
            var props = _this.props;
            var nodeId = _this.props.match.params.id;
            props.dispatch(setLoadingState({ key: "FETCHING_FULL_NODE", value: true }));
            props.dispatch(getNode(nodeId)).then(function (node) {
                _this.node = node;
                props.dispatch(setLoadingState({ key: "FETCHING_FULL_NODE", value: false }));
                props.dispatch(setLoadingState({ key: "FETCHING_INIT", value: false }));
                props.dispatch(setActiveNodeId({ id: node.id }));
                logger.info({ ctx: "loadNode", status: "done", node: node });
            });
        };
        return _this;
    }
    DataLoader.prototype.componentDidMount = function () {
        var _this = this;
        this.loadAllStubs().then(function () {
            logger.info({ ctx: "componentDidMount:loadAllStubs:fin" });
            _this.loadNode();
        });
    };
    DataLoader.prototype.loadAllStubs = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _a, loadState, dispatch;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _a = this.props, loadState = _a.loadState, dispatch = _a.dispatch;
                        if (!loadState.FETCHING_ALL_STUBS) return [3 /*break*/, 2];
                        return [4 /*yield*/, dispatch(getAllStubs())];
                    case 1:
                        _b.sent();
                        logger.info({ ctx: "loadAllStubs:exit", status: "loaded stubs" });
                        return [2 /*return*/, dispatch(setLoadingState({ key: "FETCHING_ALL_STUBS", value: false }))];
                    case 2:
                        logger.info({ ctx: "loadAllStubs:exit", status: "stubs loaded" });
                        return [2 /*return*/];
                }
            });
        });
    };
    DataLoader.prototype.render = function () {
        var fetchNode = this.props.loadState.FETCHING_FULL_NODE;
        if (fetchNode || !this.node) {
            return "DataLoader Loading";
        }
        else {
            logger.debug({ ctx: "render", node: this.node });
            return React.createElement(Pane, { node: this.node });
        }
    };
    return DataLoader;
}(React.PureComponent));
var CDataLoader = connect(mapStateToProps)(DataLoader);
export default withRouter(CDataLoader);
//# sourceMappingURL=DataLoader.js.map