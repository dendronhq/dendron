"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const jsonfile_1 = tslib_1.__importDefault(require("jsonfile"));
class MockDaoMock {
    constructor() {
        this.dbFilePath = "src/daos/MockDb/MockDb.json";
    }
    openDb() {
        return jsonfile_1.default.readFile(this.dbFilePath);
    }
    saveDb(db) {
        return jsonfile_1.default.writeFile(this.dbFilePath, db);
    }
}
exports.MockDaoMock = MockDaoMock;
//# sourceMappingURL=MockDao.mock.js.map