"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Mocks a key-value store supporting regex lookup
var DB = /** @class */ (function () {
    function DB() {
        this.data = new Map();
        this.data.set("category=languages", "Some languages");
        this.data.set("category=languages/language=python", "Python is a snake");
        this.data.set("category=languages/language=java", "Java will do");
        this.data.set("category=dishes", "Some common foods");
        this.data.set("category=dishes/dish=sushi", "Sushi is a fish");
        this.data.set("category=dishes/dish=soup", "Soup is nice");
        this.data.set("category=dishes/dish=java", "Java is coffee");
    }
    DB.prototype.query = function (regex) {
        var _this = this;
        return Array.from(this.data.keys())
            .filter(function (key) { return regex.test(key); })
            .map(function (key) { return [key, _this.data.get(key) || ""]; });
    };
    return DB;
}());
exports.default = DB;
