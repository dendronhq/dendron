var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
import { DropboxStorage, Note, makeResponse } from "@dendron/common-all";
import Fuse from "fuse.js";
import { Logger } from "@aws-amplify/core";
import _ from "lodash";
var logger = new Logger("DEngine");
var PROTO_ENGINE;
function createMockData() {
    var _a;
    var secondChildNote = new Note({
        id: "manifesto",
        title: "manifesto",
        desc: "first child desc",
        type: "note",
        schemaId: "-1",
    });
    var firstChildNote = new Note({
        id: "dendron",
        title: "dendron",
        desc: "first child desc",
        type: "note",
        schemaId: "-1",
    });
    var rootNote = new Note({
        id: "root",
        title: "root",
        desc: "root",
        type: "note",
        schemaId: "-1",
    });
    rootNote.addChild(firstChildNote);
    firstChildNote.addChild(secondChildNote);
    var initialNodes = (_a = {},
        _a[rootNote.id] = rootNote,
        _a[firstChildNote.id] = firstChildNote,
        _a[secondChildNote.id] = secondChildNote,
        _a);
    return initialNodes;
}
var INITIAL_DATA = createMockData();
function createFuse(initList, opts) {
    var options = {
        shouldSort: true,
        threshold: opts.exactMatch ? 0.0 : 0.6,
        location: 0,
        distance: 100,
        maxPatternLength: 32,
        minMatchCharLength: 1,
        keys: ["title", "path"],
    };
    // initList = _.map(initList, (n) => ({ ...n, treePath: n.path }));
    // console.log({ initList, bond: true });
    var fuse = new Fuse(initList, options);
    return fuse;
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
// @ts-ignore
var MockDataStore = /** @class */ (function () {
    function MockDataStore() {
        this.data = INITIAL_DATA;
    }
    MockDataStore.prototype.fetchInitial = function () {
        return this.data;
    };
    MockDataStore.prototype.get = function (_scope, id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                // TODO
                return [2 /*return*/, new Promise(function (resolve) {
                        setTimeout(function () {
                            var note = _.get(INITIAL_DATA, id, new Note({
                                id: id,
                                title: "sample",
                                desc: "sample",
                                type: "note",
                                schemaId: "-1",
                            }));
                            note.body = "content for " + id;
                            resolve({ data: note });
                        }, 1200);
                    })];
            });
        });
    };
    return MockDataStore;
}());
export { MockDataStore };
// @ts-ignore - TODO: implement interface
var ProtoEngine = /** @class */ (function () {
    function ProtoEngine(store) {
        //this.nodes = store.fetchInitial();
        this.nodes = {};
        this.store = store;
        var fuseList = _.values(this.nodes);
        this.fuse = createFuse(fuseList, { exactMatch: false });
        this.fullNodes = new Set();
        this.queries = new Set();
    }
    ProtoEngine.getEngine = function () {
        if (!PROTO_ENGINE) {
            // PROTO_ENGINE = new ProtoEngine(new MockDataStore());
            PROTO_ENGINE = new ProtoEngine(new DropboxStorage());
            return PROTO_ENGINE;
        }
        return PROTO_ENGINE;
    };
    ProtoEngine.prototype._nodeInCache = function (node, opts) {
        var _a;
        var hasStub = _.has(this.nodes, node.id);
        var fufillsFull = ((_a = opts) === null || _a === void 0 ? void 0 : _a.fullNode) ? true : this.fullNodes.has(node.id);
        return hasStub && fufillsFull;
    };
    // FIXME: query doesn't check for full nodes
    ProtoEngine.prototype._queryInCache = function (qs) {
        var hasQuery = _.has(this.queries, qs);
        return hasQuery;
    };
    /**
     * Updates local cache
     * @param nodes
     * @param opts
     */
    ProtoEngine.prototype.refreshNodes = function (nodes, opts) {
        var _this = this;
        nodes.forEach(function (node) {
            var _a;
            var id = node.id;
            // add if not exist
            if (!_.has(_this.nodes, id)) {
                _this.nodes[id] = node;
            }
            else {
                _.merge(_this.nodes[id], node);
                if ((_a = opts) === null || _a === void 0 ? void 0 : _a.fullNode) {
                    _this.fullNodes.add(id);
                }
            }
        });
        this.updateLocalCollection(_.values(this.nodes));
    };
    ProtoEngine.prototype.updateLocalCollection = function (collection) {
        this.fuse.setCollection(collection);
    };
    ProtoEngine.prototype.get = function (_scope, id, opts) {
        var _a;
        return __awaiter(this, void 0, void 0, function () {
            var node, fnResp;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        node = this.nodes[id];
                        opts = _.defaults(opts || {}, { fullNode: true });
                        if (!(((_a = opts) === null || _a === void 0 ? void 0 : _a.fullNode) && !this.fullNodes.has(id))) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.store.get(_scope, id, __assign(__assign({}, opts), { webClient: true }))];
                    case 1:
                        fnResp = _b.sent();
                        logger.debug({ ctx: "get:store.get:post", id: id, opts: opts, fnResp: fnResp });
                        this.refreshNodes([fnResp.data], opts);
                        return [2 /*return*/, fnResp];
                    case 2: return [2 /*return*/, { data: node }];
                }
            });
        });
    };
    ProtoEngine.prototype.query = function (scope, queryString, opts) {
        return __awaiter(this, void 0, void 0, function () {
            var data, results, items, fetchedFullNodes;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        console.log({ scope: scope, queryString: queryString, opts: opts });
                        opts = _.defaults(opts || {}, {
                            fullNode: false,
                        });
                        if (!(queryString === "**/*")) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.store.query(scope, "**/*", opts)];
                    case 1:
                        data = _a.sent();
                        this.refreshNodes(data.data);
                        return [2 /*return*/, data];
                    case 2:
                        results = this.fuse.search(queryString);
                        logger.debug({ ctx: "query:fuse.search:post", results: results, queryString: queryString });
                        if (opts.queryOne) {
                            items = [results[0].item];
                        }
                        else {
                            items = _.map(results, function (resp) { return resp.item; });
                        }
                        if (!opts.fullNode) return [3 /*break*/, 4];
                        return [4 /*yield*/, Promise.all(_.map(items, function (ent) { return __awaiter(_this, void 0, void 0, function () {
                                var fn;
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0:
                                            if (!!this.fullNodes.has(ent.id)) return [3 /*break*/, 2];
                                            logger.debug({
                                                ctx: "query:fuse.search:post",
                                                status: "fetch full node from store",
                                            });
                                            return [4 /*yield*/, this.get(scope, ent.id)];
                                        case 1:
                                            fn = _a.sent();
                                            return [2 /*return*/, fn.data];
                                        case 2:
                                            logger.debug({
                                                ctx: "query:fuse.search:post",
                                                status: "fetch full node from cache",
                                            });
                                            return [2 /*return*/, null];
                                    }
                                });
                            }); }))];
                    case 3:
                        fetchedFullNodes = _a.sent();
                        this.refreshNodes(_.filter(fetchedFullNodes, function (ent) { return !_.isNull(ent); }), { fullNode: true });
                        logger.debug({ ctx: "query:fetchedFullNodes:exit", fetchedFullNodes: fetchedFullNodes });
                        _a.label = 4;
                    case 4:
                        logger.debug({ ctx: "query:exit", items: items });
                        return [2 /*return*/, makeResponse({
                                data: _.map(items, function (item) { return _this.nodes[item.id]; }),
                                error: null,
                            })];
                }
            });
        });
    };
    return ProtoEngine;
}());
export { ProtoEngine };
export function engine() {
    return ProtoEngine.getEngine();
}
//# sourceMappingURL=engine.js.map