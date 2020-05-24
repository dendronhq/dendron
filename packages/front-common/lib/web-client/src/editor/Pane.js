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
import { Logger } from "@aws-amplify/core";
import OutlineEditor from "rich-markdown-editor";
import React from "react";
import { connect } from "react-redux";
var logger = new Logger("Pane");
var mapStateToProps = function (state) { return ({
    nodeState: state.nodeReducer,
    loadingState: state.loadingReducer,
}); };
var PaneComp = /** @class */ (function (_super) {
    __extends(PaneComp, _super);
    function PaneComp(props) {
        var _this = _super.call(this, props) || this;
        _this.state = {
            readOnly: false,
            dark: localStorage.getItem("dark") === "enabled",
        };
        // On change, update the app's React state with the new editor value.
        _this.onChange = function (_a) {
            var value = _a.value;
            console.log("TODO" + value);
        };
        _this.setEditorRef = function (ref) {
            _this.editor = ref;
        };
        logger.info({
            ctx: "constructor:enter",
            props: props,
        });
        return _this;
    }
    // Render the editor.
    PaneComp.prototype.render = function () {
        var _this = this;
        var _a;
        var _b = this.props, loadingState = _b.loadingState, node = _b.node;
        if (loadingState.FETCHING_INIT) {
            return "Loading...";
        }
        var defaultValue = node.renderBody();
        (_a = this.editor) === null || _a === void 0 ? void 0 : _a.setState({ editorValue: defaultValue });
        console.log({ ctx: "Pane/render", defaultValue: defaultValue });
        return (React.createElement(OutlineEditor, { id: node.id, readOnly: this.state.readOnly, defaultValue: defaultValue, onSave: function (options) {
                console.log("Save triggered", options);
                console.log({ state: _this.state });
            }, onCancel: function () { return console.log("Cancel triggered"); }, onChange: this.onChange, onClickLink: function (href) { return console.log("Clicked link: ", href); }, onClickHashtag: function (tag) { return console.log("Clicked hashtag: ", tag); }, onShowToast: function (message) { return window.alert(message); }, onSearchLink: function (term) { return __awaiter(_this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    console.log("Searched link: ", term);
                    return [2 /*return*/, [
                            {
                                title: term,
                                url: "localhost",
                            },
                        ]];
                });
            }); }, uploadImage: function (file) {
                console.log("File upload triggered: ", file);
                return new Promise(function () {
                    return;
                });
                // Delay to simulate time taken to upload
                //   return new Promise((resolve) => {
                //     setTimeout(() => resolve("http://lorempixel.com/400/200/"), 1500);
                //   });
            }, getLinkComponent: function () {
                console.log("get link component");
                var AComp = function () {
                    return React.createElement("div", null, "StubLink");
                };
                return AComp;
            }, dark: this.state.dark, autoFocus: false, toc: true }));
    };
    return PaneComp;
}(React.Component));
export { PaneComp };
export default connect(mapStateToProps, null, null, {
    forwardRef: true,
})(PaneComp);
//# sourceMappingURL=Pane.js.map