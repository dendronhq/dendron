"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var server_1 = __importDefault(require("../src/server"));
var server = new server_1.default();
test.each([
    ["languages/python", { "languages": { "python": { "": "Python is a snake" } } }],
    ["languages/language=java", { "languages": { "java": { "": "Java will do" } } }],
    ["language=java", { "java": { "": "Java will do" } }],
    ["java", {}],
    ["category=languages/language=java", { "languages": { "java": { "": "Java will do" } } }],
    ["language=java/category=languages", { "java": { "languages": { "": "Java will do" } } }],
    ["java/category=languages", {}],
    ["java/languages", {}],
    ["category=languages", { "languages": { "": "Some languages" } }],
    ["languages/*", { "languages": { "python": { "": "Python is a snake" }, "java": { "": "Java will do" } } }],
    ["languages/**", { "languages": { "python": { "": "Python is a snake" }, "java": { "": "Java will do" } } }],
    ["*/python", { "languages": { "python": { "": "Python is a snake" } } }],
    ["**/python", { "languages": { "python": { "": "Python is a snake" } } }],
    ["*/java", { "languages": { "java": { "": "Java will do" } }, "dishes": { "java": { "": "Java is coffee" } } }],
])('query', function (query, response) { return expect(server.query(query)).toStrictEqual(response); });
