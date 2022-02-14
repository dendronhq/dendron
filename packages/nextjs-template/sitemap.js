"use strict";
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
exports.__esModule = true;
exports.getNoteUrl = exports.getNotes = exports.getDataDir = void 0;
var common_all_1 = require("@dendronhq/common-all");
var fs_extra_1 = __importDefault(require("fs-extra"));
var lodash_1 = __importDefault(require("lodash"));
var path_1 = __importDefault(require("path"));
/**
 * INLINE all typescript dependencies
 */
process.env.DATA_DIR = "data";
var _NOTES_CACHE;
function getDataDir() {
    var dataDir = process.env.DATA_DIR;
    if (!dataDir) {
        throw new Error("DATA_DIR not set");
    }
    return dataDir;
}
exports.getDataDir = getDataDir;
function getNotes() {
    if (lodash_1["default"].isUndefined(_NOTES_CACHE)) {
        var dataDir = getDataDir();
        _NOTES_CACHE = fs_extra_1["default"].readJSONSync(path_1["default"].join(dataDir, "notes.json"));
    }
    return _NOTES_CACHE;
}
exports.getNotes = getNotes;
function getNoteUrl(opts) {
    var note = opts.note, noteIndex = opts.noteIndex;
    return note.id === noteIndex.id ? "/" : "/notes/" + note.id;
}
exports.getNoteUrl = getNoteUrl;
function getRootUrlStatic() {
    var config = fs_extra_1["default"].readJSONSync(path_1["default"].join("data", "dendron.json"));
    var publishingConfig = common_all_1.ConfigUtils.getPublishingConfig(config);
    var url = publishingConfig.siteUrl;
    var assetsPrefix = publishingConfig.assetsPrefix;
    if (assetsPrefix) {
        url += assetsPrefix;
    }
    return url;
}
var genSiteMap = function () { return __awaiter(void 0, void 0, void 0, function () {
    var _a, notes, noteIndex, fields;
    return __generator(this, function (_b) {
        _a = getNotes(), notes = _a.notes, noteIndex = _a.noteIndex;
        fields = lodash_1["default"].values(notes).map(function (note) {
            var suffix = getNoteUrl({ note: note, noteIndex: noteIndex });
            var out = {
                loc: suffix,
                lastmod: common_all_1.DateTime.fromMillis(note.updated).toISO()
            };
            return out;
        });
        return [2 /*return*/, fields];
    });
}); };
module.exports = {
    siteUrl: getRootUrlStatic(),
    generateRobotsTxt: true,
    additionalPaths: function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, genSiteMap()];
        });
    }); }
};
