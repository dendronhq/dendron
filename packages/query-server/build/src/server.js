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
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = __importDefault(require("express"));
var db_1 = __importDefault(require("./db"));
var Server = /** @class */ (function () {
    function Server() {
        var _this = this;
        this.app = express_1.default();
        this.db = new db_1.default();
        this.app.get('/*', function (req, res) { return __awaiter(_this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, res.json(this.query(req.path.slice(1)))];
        }); }); });
    }
    Server.prototype.query = function (query) {
        var regexes = this.query_to_regexes(query);
        var combined_regex = RegExp("(?=.*" + regexes.join(")(?=.*") + ")(?:(?:.*" + regexes.join("$)|(?:.*") + "$))"); // intersection of regexes
        console.log(combined_regex);
        return this.to_tree(this.update_path(this.db.query(combined_regex), regexes));
    };
    // The basic strategy is to create groups of positionally-matched values,
    // each initiated by an explicitly matched value. This means that each explicit match
    // sets the position for subsequent positional matches.
    Server.prototype.query_to_regexes = function (query) {
        var filters = query.split('/');
        var filter_groups = [];
        if (!filters[0].includes("="))
            filter_groups.push([]); // create first group
        for (var _i = 0, filters_1 = filters; _i < filters_1.length; _i++) {
            var filter = filters_1[_i];
            if (filter.includes("=")) { // explicit match (/foo=bar/ and /foo=/)
                filter_groups.push([]);
                filter_groups[filter_groups.length - 1].push(filter + (filter.indexOf("=") == filter.length - 1 ? "[^/]*" : ""));
            }
            else { // positional match (/*/, /**/, and /bar/)
                filter_groups[filter_groups.length - 1].push(filter.includes("*") ? (filter.includes("**") ? ".*" : "[^/]*") : ("[^/]*\\=" + filter));
            }
        }
        if (!filters[0].includes("="))
            filter_groups[0][0] = "^" + filter_groups[0][0]; // start at top
        return filter_groups.map(function (group) { return group.join('/'); });
    };
    // puts the returned path into the requested order, and fills in all missing information
    Server.prototype.update_path = function (results, regexes) {
        return results.map(function (result) { return [regexes.map(function (r) { return result[0].match(r); }).join('/'), result[1]]; });
    };
    Server.prototype.to_tree = function (results, strip_schema) {
        if (strip_schema === void 0) { strip_schema = true; }
        var insert_value = function (tree, key, value, key_position) {
            console.log(tree, key, value, key_position);
            if (key_position >= key.length) {
                tree[""] = value;
                return;
            }
            var local_key = strip_schema ? key[key_position].split("=").pop() || "" : key[key_position];
            console.log(tree);
            if (!tree.hasOwnProperty(local_key)) {
                tree[local_key] = {};
            }
            console.log(tree);
            insert_value(tree[local_key], key, value, key_position + 1);
            console.log(tree);
        };
        var out = {};
        for (var _i = 0, results_1 = results; _i < results_1.length; _i++) {
            var result = results_1[_i];
            console.log("here");
            console.log(out);
            insert_value(out, result[0].split("/"), result[1], 0);
            console.log(out);
        }
        return out;
    };
    Server.prototype.listen = function () {
        this.app.listen(parseInt(process.env.PORT || "3000"));
    };
    return Server;
}());
exports.default = Server;
