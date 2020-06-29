import { BaseCommand } from "./base";
import _ from "lodash";
import { createLogger, getAllFiles } from "@dendronhq/common-server";
import { Dirent } from "fs-extra";
import fs from "fs-extra";
import path from "path";

const L = createLogger("dendron");

type RefactorCommandOpts = {
    dryRun?: boolean
    exclude?: string[]
    include?: string[]
    /**
     * Perform up to limit changes
     */
    limit?: number
    root: string
    rules: string[]
};

type RefactorRule = {
    name: string
    matcher: RegExp
    replacer: (
        match: RegExpMatchArray | null,
        txt: string
    ) => { txtClean: string; diff: any }
    opts?: {
        matchIfNull: boolean
    }
};

export const RULES = {
    ADD_FM_BLOCK: "ADD_FM_BLOCK",
};

export class RefactorCommand extends BaseCommand<RefactorCommandOpts> {
    public rules: { [key: string]: RefactorRule };

    constructor() {
        super();
        this.rules = {};
        this._registerRules();
    }

    _registerRules() {
        const rules = [
            {
                name: RULES.ADD_FM_BLOCK,
                matcher: /^---/,
                replacer: (_match: RegExpMatchArray | null, txt: string) => {
                    const fm = "---\n\n---\n";
                    const output = [fm, txt];
                    return { txtClean: output.join("\n"), diff: {} };
                },
                opts: {
                    matchIfNull: true,
                },
            }
        ];
        rules.forEach(r => {
            this.rules[r.name] = r;
        });
    }

    async execute(opts: RefactorCommandOpts) {
        const { root, dryRun, exclude, include, limit, rules } = _.defaults(opts, {
            include: ["*.md"],
            exclude: [],
            dryRun: false,
            limit: 9999,
        });
        const stats = {
            numChanged: 0,
        };
        const allFiles = getAllFiles({
            root,
            exclude,
            include,
            withFileTypes: true,
        }) as Dirent[];
        allFiles.forEach(dirent => {
            const { name: fname } = dirent;

            if (stats.numChanged > limit) {
                L.info(`reached limit of ${limit} changes`);
                process.exit(0);
            }

            const txt = fs.readFileSync(path.join(root, fname), "utf8");
            L.debug({ ctx: "execute:process", fname });
            rules.forEach(_r => {
                const r = this.rules[_r];
                const { matcher, replacer } = r;
                const match = txt.match(matcher);
                const ruleOpts = _.defaults(r.opts, { matchIfNull: false });
                L.debug({ ctx: "execute:process:match", r, match, fname });
                if (
                    (!_.isNull(match) && !ruleOpts.matchIfNull) ||
                    (_.isNull(match) && ruleOpts.matchIfNull)
                ) {
                    stats.numChanged += 1;
                    const { txtClean, diff } = replacer(match, txt);
                    const dstPath = path.join(root, fname);
                    L.debug({
                        ctx: "writeFileSync:pre",
                        diff,
                        fname,
                        txtClean,
                    });
                    if (!dryRun) {
                        fs.writeFileSync(dstPath, txtClean);
                    }
                }
            });
        });
        L.info({ ctx: "execute:exit", stats });
    }
}

async function main() {
    const root = process.argv[2];
    await new RefactorCommand().execute({
        root,
        rules: [RULES.ADD_FM_BLOCK],
        // include: ['cli.pbcopy.md'],
        dryRun: true,
        // dryRun: true,
        limit: 10,
    });
    L.info("done");
    //   const store = createStorage();
    //   const resp = await store.query({ username: 'kevin' }, '**/*', {});
    //   console.log({ resp });
}

console.log("start");
main();
