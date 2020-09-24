"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DendronEngineServer = void 0;
const engine_server_1 = require("@dendronhq/engine-server");
class DendronEngineServer {
    constructor(opts) {
        this.opts = opts;
    }
    static getOrCreate(opts) {
        if (!DendronEngineServer._instance) {
            DendronEngineServer._instance = new DendronEngineServer(opts);
        }
        return DendronEngineServer._instance;
    }
    init() {
        const root = this.opts.roots[0];
        if (!root) {
            return;
        }
        const engine = engine_server_1.DendronEngine.getOrCreateEngine({
            root: root.uri,
            forceNew: true,
        });
        this._engine = engine;
        this._engine.init();
    }
}
exports.DendronEngineServer = DendronEngineServer;
//# sourceMappingURL=engine-server.js.map