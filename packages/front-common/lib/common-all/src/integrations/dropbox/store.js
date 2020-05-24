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
import { Dropbox } from "dropbox";
import { fileToNote } from "./utils";
import _ from "lodash";
import { makeResponse } from "../../helpers";
require("isomorphic-fetch");
function binaryToUtf8(data) {
    var fileBuffer = new Buffer(data, "binary");
    return fileBuffer.toString("utf8");
}
var DropboxStorage = /** @class */ (function () {
    function DropboxStorage() {
        this.client = new Dropbox({
            // TODO: don't hardcode
            accessToken: "AxthRhvjDPAAAAAAAACiPVhX_A4isFrjeyDXsV8H1yqARcM9fCInltiA0eZukImA"
        });
    }
    DropboxStorage.prototype.get = function (_scope, id, opts) {
        var _a;
        return __awaiter(this, void 0, void 0, function () {
            var resp, body, data;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        opts = _.defaults(opts || {}, {});
                        if (!(id === "root")) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.client.filesDownload({ path: "/root.md" })];
                    case 1:
                        // @ts-ignore
                        resp = _b.sent();
                        return [3 /*break*/, 4];
                    case 2: return [4 /*yield*/, this.client.filesDownload({ path: "id:" + id })];
                    case 3:
                        // @ts-ignore
                        resp = _b.sent();
                        _b.label = 4;
                    case 4:
                        console.log({ resp: resp });
                        body = "Empty Doc";
                        if (!((_a = opts) === null || _a === void 0 ? void 0 : _a.webClient)) return [3 /*break*/, 6];
                        return [4 /*yield*/, resp.fileBlob.text()];
                    case 5:
                        body = _b.sent();
                        return [3 /*break*/, 7];
                    case 6:
                        body = binaryToUtf8(resp.fileBinary);
                        _b.label = 7;
                    case 7:
                        data = fileToNote(resp, body);
                        return [2 /*return*/, {
                                data: data
                            }];
                }
            });
        });
    };
    DropboxStorage.prototype.query = function (_scope, queryString, _opts) {
        return __awaiter(this, void 0, void 0, function () {
            var resp, data;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!(queryString === "**/*")) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.client.filesListFolder({
                                path: ""
                            })];
                    case 1:
                        resp = (_a.sent());
                        data = resp.entries.map(function (ent) { return fileToNote(ent); });
                        return [2 /*return*/, makeResponse({ data: data, error: null })];
                    case 2: throw "unsupported " + queryString;
                }
            });
        });
    };
    return DropboxStorage;
}());
export { DropboxStorage };
// dbx
//   .filesListFolder({ path: "" })
//   .then(function(response) {
//     console.log(response);
//   })
//   .catch(function(error) {
//     console.log(error);
//   });
//# sourceMappingURL=store.js.map