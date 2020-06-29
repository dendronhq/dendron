import { createLogger, getAllFiles } from "@dendronhq/common-server";
import { FileParser, FileStorage } from "@dendronhq/engine-server";
import { BaseCommand } from "./base";
import _ from "lodash";

const L = createLogger("ParseCommand");

type ParseCommandOpts = {
    root: string
    exclude?: string[]
    bailOnError?: boolean
    /**
     * Might need to run this multiple times until all issues are fixed
     */
    fixMissing?: boolean
};

export class ParseCommand extends BaseCommand<ParseCommandOpts> {
    async execute(opts: ParseCommandOpts) {
        opts = _.defaults(opts, { bailOnError: false });
        L.info({ ctx: "execute:enter", opts });
        const storage = new FileStorage({ root: opts.root });
        const allFiles = getAllFiles({ root: opts.root }) as string[];
        const fp = new FileParser(storage, {
            errorOnEmpty: false,
            errorOnBadParse: opts.bailOnError,
        });
        // @ts-ignore
        const _data = fp.parse(allFiles);
        const report = fp.report();
        const errors = fp.errors;
        const badParseErrors = errors.filter(e => e.status === "BAD_PARSE");
        L.info({ ctx: "execute:parse:post", report });
        L.info({ ctx: "execute:parse:post", errors });
        L.info({ ctx: "execute:parse:post", badParseErrors });
        L.info({ ctx: "execute:parse:post", numParseErrors: badParseErrors.length });
        L.info({ ctx: "execute:exit" });
    }
}

async function main() {
    const root = process.argv[2];
    await new ParseCommand().execute({
        root,
        fixMissing: false,
    });
}

main();
