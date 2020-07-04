import { createLogger, mdFile2NodeProps, node2MdFile, node2PropsMdFile } from "@dendronhq/common-server";
import { RefactorCommandOpts, RefactorBaseCommand } from "./Refactor";
import { NoteRawProps } from "@dendronhq/common-all";
import { FileUtils } from "../utils";
import _ from "lodash";

const L = createLogger("RefactorYamlCommand");

type File = NoteRawProps & {extra?: any}
export class RefactorYamlCommand extends RefactorBaseCommand<File, any> {
    constructor(opts: RefactorCommandOpts) {
        super("RefactorYamlCommand", opts);
    }

    readFile(fpath: string) {
        return mdFile2NodeProps(fpath, {returnExtra: true});
    }

    writeFile(_fpath: string, data: File) {
        return node2PropsMdFile(_.omit(data, "extra"), {root: this.props.root});
    }

    matchFile(file: File) {
        return {
            isMatch: !_.isEmpty(file.extra),
            matchData: file.extra
        }
    }

    refactorFile(file: File, matchData: any) {
        file.custom = matchData
        return file;
    }
}

async function main() {
    const root = process.argv[2];
    const opts = {
        root,
        rules: [],
        dryRun: false,
    };
    await new RefactorYamlCommand(opts).execute();
}

main();