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
import { createSlice } from "@reduxjs/toolkit";
import { Logger } from "@aws-amplify/core";
import { ProtoEngine } from "../../proto/engine";
import _ from "lodash";
var logger = new Logger("nodeReducer");
// === BEGIN PROTO {
// @ts-ignore - TODO
export var YAML_PROJECT_BASE = "\n  name: project\n  schema:\n      root:\n        children:\n          quickstart: \n          topic: \n          version: \n          features:\n          rel:\n      quickstart:\n        desc: get started with project\n      features:\n        desc: what does it do\n      ref:\n        kind: namespace\n        choices:\n            competitors: \n            shortcuts:\n      rel:\n        desc: relative\n      version:\n        children:\n          version-major: \n          version-minor: \n          version-breaking: \n      plan:\n        children:\n          requirements:\n            alias: req\n          timeline:\n            desc: \"how long will it take\"\n      version-major:\n        desc: the major version\n";
// @ts-ignore TODO
export var YAML_PROJECT_DEV = "\n  name: dev project\n  schema: \n    root:\n      children: \n        upgrade:\n        dev:\n        ref:\n    dev:\n      children:\n        dev-layout: \n        architecture:\n          alias: arch        \n        qa:\n        ops:\n    ref:\n      children:\n        config:\n        lifecycle:\n    config: \n";
var initialState = {
    // get(): Promise<DNode>
    //
    // schemaDict: { ...initialTree.nodes },
    // noteStubDict: { ...initialNoteStubs },
    // treeOrientation: "horizontal",
    activeNodeId: "",
};
var nodeSlice = createSlice({
    name: "node",
    initialState: initialState,
    reducers: {
        setActiveNodeId: function (state, action) {
            state.activeNodeId = action.payload.id;
        },
    },
});
var effects = {
    /**
     * Fetch full node
     */
    queryOne: function (query) { return function () { return __awaiter(void 0, void 0, void 0, function () {
        var scope, engine, resp;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    scope = { username: "kevin" };
                    engine = ProtoEngine.getEngine();
                    return [4 /*yield*/, engine.query(scope, query, {
                            fullNode: true,
                            queryOne: true,
                        })];
                case 1:
                    resp = _a.sent();
                    logger.debug({ ctx: "queryOne:exit", resp: resp });
                    // FIXME: verify
                    return [2 /*return*/, resp.data[0]];
            }
        });
    }); }; },
    query: function (query, opts) { return function () { return __awaiter(void 0, void 0, void 0, function () {
        var scope, engine, resp;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    //TODO
                    opts = _.defaults(opts || {}, { fullNode: false });
                    scope = { username: "kevin" };
                    engine = ProtoEngine.getEngine();
                    return [4 /*yield*/, engine.query(scope, query, opts)];
                case 1:
                    resp = _a.sent();
                    // FIXME: verify
                    return [2 /*return*/, resp.data];
            }
        });
    }); }; },
    getNode: function (id) { return function () { return __awaiter(void 0, void 0, void 0, function () {
        var scope, engine, resp;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    scope = { username: "kevin" };
                    engine = ProtoEngine.getEngine();
                    return [4 /*yield*/, engine.get(scope, id, {
                            fullNode: true,
                        })];
                case 1:
                    resp = _a.sent();
                    // FIXME: verify
                    return [2 /*return*/, resp.data];
            }
        });
    }); }; },
    getAllStubs: function () { return function () { return __awaiter(void 0, void 0, void 0, function () {
        var scope, engine, resp;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    scope = { username: "kevin" };
                    engine = ProtoEngine.getEngine();
                    return [4 /*yield*/, engine.query(scope, "**/*", { fullNode: false })];
                case 1:
                    resp = _a.sent();
                    return [2 /*return*/, resp.data];
            }
        });
    }); }; },
};
var reducer = nodeSlice.reducer, actions = nodeSlice.actions;
export { reducer as nodeReducer, actions as nodeActions, effects as nodeEffects, };
//# sourceMappingURL=nodeReducer.js.map