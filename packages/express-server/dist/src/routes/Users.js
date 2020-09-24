"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const express_1 = require("express");
const http_status_codes_1 = require("http-status-codes");
const router = express_1.Router();
const userDao = {};
const paramMissingError = "bad";
router.get("/all", (req, res) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
    const users = yield userDao.getAll();
    return res.status(http_status_codes_1.OK).json({ users });
}));
router.post("/add", (req, res) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
    const { user } = req.body;
    if (!user) {
        return res.status(http_status_codes_1.BAD_REQUEST).json({
            error: paramMissingError,
        });
    }
    yield userDao.add(user);
    return res.status(http_status_codes_1.CREATED).end();
}));
router.put("/update", (req, res) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
    const { user } = req.body;
    if (!user) {
        return res.status(http_status_codes_1.BAD_REQUEST).json({
            error: paramMissingError,
        });
    }
    user.id = Number(user.id);
    yield userDao.update(user);
    return res.status(http_status_codes_1.OK).end();
}));
router.delete("/delete/:id", (req, res) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    yield userDao.delete(Number(id));
    return res.status(http_status_codes_1.OK).end();
}));
exports.default = router;
//# sourceMappingURL=Users.js.map