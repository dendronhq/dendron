"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LSPUtils = void 0;
class LSPUtils {
    static instance(connection) {
        if (connection) {
            this.connection = connection;
        }
    }
    static async wsFolders() {
        return await this
            .connection.workspace.getWorkspaceFolders();
    }
}
exports.LSPUtils = LSPUtils;
//# sourceMappingURL=utils.js.map