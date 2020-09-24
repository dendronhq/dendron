"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const express_1 = require("express");
const http_status_codes_1 = require("http-status-codes");
const router = express_1.Router();
router.put("/update", (req, res) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
    const { user } = req.body;
    console.log("got update");
    if (!user) {
        return res.status(http_status_codes_1.BAD_REQUEST).json({
            error: "param missing",
        });
    }
    return res.status(http_status_codes_1.OK).json({ users: "1" });
}));
router.get("/all", (req, res) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
    return res.status(http_status_codes_1.OK).json({ users: "1" });
}));
exports.default = router;
//# sourceMappingURL=Engine.js.map