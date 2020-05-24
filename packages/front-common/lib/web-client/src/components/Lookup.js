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
import Autosuggest from "react-autosuggest";
import { withRouter } from "react-router-dom";
import { Logger } from "@aws-amplify/core";
import { NodePreview } from "./NodePreview";
import React from "react";
import _ from "lodash";
import { connect } from "react-redux";
import { engine } from "../proto/engine";
import { loadingActions } from "../redux/reducers/loadingReducer";
import { nodeEffects } from "../redux/reducers/nodeReducer";
/*
import { sampleActions } from "../redux/reducers/sampleReducer";
*/
var queryOne = nodeEffects.queryOne, query = nodeEffects.query;
var setLoadingState = loadingActions.setLoadingState;
var logger = new Logger("Lookup");
var mapStateToProps = function (state) { return ({
    nodeState: state.nodeReducer,
}); };
var LookupComp = /** @class */ (function (_super) {
    __extends(LookupComp, _super);
    function LookupComp(props) {
        var _this = _super.call(this, props) || this;
        _this.storeInputRef = function (input) {
            if (input !== null) {
                _this.autosuggest = input;
            }
        };
        // ---
        _this.fetchResult = function (value, reason) { return __awaiter(_this, void 0, void 0, function () {
            var _a, history, dispatch, node;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        logger.info({
                            ctx: "fetchResult:enter",
                            value: value,
                            reason: reason,
                        });
                        _a = this.props, history = _a.history, dispatch = _a.dispatch;
                        if (value === "") {
                            value = "root";
                        }
                        this.props.dispatch(setLoadingState({ key: "FETCHING_FULL_NODE", value: true }));
                        return [4 /*yield*/, dispatch(queryOne(value))];
                    case 1:
                        node = _b.sent();
                        this.props.dispatch(setLoadingState({ key: "FETCHING_FULL_NODE", value: false }));
                        logger.info({
                            ctx: "fetchResult:exit",
                            node: node,
                        });
                        history.push(node.url);
                        return [2 /*return*/];
                }
            });
        }); };
        _this.focus = function () {
            var autosuggest = _this.autosuggest;
            if (autosuggest && autosuggest.input) {
                autosuggest.input.focus();
            }
        };
        _this.getSuggestions = function (value) { return __awaiter(_this, void 0, void 0, function () {
            var suggestions;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.props.dispatch(query(value))];
                    case 1:
                        suggestions = _a.sent();
                        return [2 /*return*/, suggestions];
                }
            });
        }); };
        _this.getSuggestionValue = function (suggestion) {
            return suggestion.path;
        };
        _this.onChange = function (event, _a) {
            var newValue = _a.newValue, method = _a.method;
            logger.info({
                meth: "onChange",
                ctx: "enter",
                event: event,
                newValue: newValue,
                method: method,
            });
            _this.setState({ rawValue: newValue });
        };
        _this.onKeyDown = function (event) { return __awaiter(_this, void 0, void 0, function () {
            var keyCode;
            return __generator(this, function (_a) {
                keyCode = event.keyCode;
                logger.info({
                    meth: "onKeyDown",
                    ctx: "enter",
                    keyCode: keyCode,
                });
                switch (keyCode) {
                    case 13: // enter
                        this.fetchResult(this.state.rawValue, "enter");
                        break;
                }
                return [2 /*return*/];
            });
        }); };
        _this.onRenderSuggestion = function (suggestion) {
            return (React.createElement("div", { className: "result" },
                React.createElement(NodePreview, { node: suggestion })));
        };
        _this.onSuggestionsClearRequested = function () {
            _this.setState({
                suggestions: [],
            });
        };
        _this.onSuggestionsFetchRequested = function (_a) {
            var value = _a.value, reason = _a.reason;
            return __awaiter(_this, void 0, void 0, function () {
                var suggestions;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            logger.info({
                                meth: "onSuggestionsFetchRequested",
                                ctx: "enter",
                                value: value,
                                reason: reason,
                            });
                            return [4 /*yield*/, this.getSuggestions(value)];
                        case 1:
                            suggestions = _b.sent();
                            this.setState({
                                suggestions: suggestions,
                            });
                            return [2 /*return*/];
                    }
                });
            });
        };
        _this.state = {
            rawValue: "",
            suggestions: _.values(engine().nodes),
        };
        return _this;
    }
    // --- LifeCycle
    LookupComp.prototype.componentDidMount = function () {
        logger.info({ ctx: "componentDidMount" });
        this.focus();
    };
    LookupComp.prototype.render = function () {
        var _a = this.state, suggestions = _a.suggestions, rawValue = _a.rawValue;
        var style = this.props.style;
        logger.info({ meth: "render", ctx: "enter" });
        var inputProps = {
            placeholder: "Lookup",
            value: rawValue,
            onChange: this.onChange,
            autoFocus: true,
            onKeyDown: this.onKeyDown,
            style: style,
        };
        return (React.createElement(Autosuggest, { suggestions: suggestions, onSuggestionsFetchRequested: this.onSuggestionsFetchRequested, onSuggestionsClearRequested: this.onSuggestionsClearRequested, getSuggestionValue: this.getSuggestionValue, renderSuggestion: this.onRenderSuggestion, 
            //   shouldRenderSuggestions={this.shouldRenderSuggestions}
            inputProps: inputProps, 
            //   highlightFirstSuggestion={false}
            //   onSuggestionHighlighted={this.onSuggestionHighlighted}
            alwaysRenderSuggestions: false, multiSection: false, 
            //   getSectionSuggestions={this.getSectionSuggestions}
            //   renderSectionTitle={this.renderSectionTitle}
            //   onSuggestionSelected={this.onSuggestionSelected}
            //   renderInputComponent={this.renderInputComponent}
            //   renderSuggestionsContainer={this.onRenderSuggestionsContainer}
            ref: this.storeInputRef }));
    };
    LookupComp.defaultProps = { style: {} };
    return LookupComp;
}(React.PureComponent));
export { LookupComp };
var CLookupComp = connect(mapStateToProps, null, null, { forwardRef: true })(LookupComp);
export default withRouter(CLookupComp);
//# sourceMappingURL=Lookup.js.map