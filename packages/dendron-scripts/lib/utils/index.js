"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PublishUtils = void 0;
const execa_1 = require("execa");
const fs_extra_1 = __importDefault(require("fs-extra"));
class PublishUtils {
    static getPkgPath() {
        // TODO: don't hardcode
        return "/Users/kevinlin/code/dendron/build/dendron/packages/plugin-core";
    }
    static getPkgMeta({ pkgPath }) {
        return fs_extra_1.default.readJSONSync(pkgPath);
    }
    static updatePkgMeta({ pkgPath, name, description, }) {
        const pkg = fs_extra_1.default.readJSONSync(pkgPath);
        pkg.name = name;
        pkg.displayName = name;
        pkg.description = description;
        pkg.main = "dist/extension.js";
        fs_extra_1.default.writeJSONSync(pkgPath, pkg, { spaces: 4 });
    }
    static async installAndPackageDeps({ cwd }) {
        await execa_1.command("yarn install --no-lockfile", { cwd });
        await execa_1.command("vsce package --yarn", { cwd });
    }
    static async publish({ cwd, osvxKey }) {
        return await Promise.all([
            execa_1.command("vsce publish", { cwd }),
            execa_1.command("ovsx publish", {
                cwd,
                env: {
                    OVSX_PAT: osvxKey,
                },
            }),
        ]);
    }
    static async publishInsider() {
        const pkgPath = this.getPkgPath();
        const { name, version } = await this.getPkgMeta({ pkgPath });
        const package = `${name}-${version}.vsix`;
        await execa_1.command(`aws s3 cp $package s3://artifacts-prod-artifactb7980f61-19orqnnuurvwy/publish/$${package}`);
        console.log(`https://artifacts-prod-artifactb7980f61-19orqnnuurvwy.s3.amazonaws.com/publish/${package}`);
    }
}
exports.PublishUtils = PublishUtils;
//# sourceMappingURL=index.js.map