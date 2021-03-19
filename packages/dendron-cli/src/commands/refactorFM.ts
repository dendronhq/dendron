import { DVault, NoteProps } from "@dendronhq/common-all";
import { file2Note } from "@dendronhq/common-server";
import path from "path";
import { RefactorBaseCommand, RefactorRule } from "./refactorBase";

type RuleData = {
  from: { key: string };
  to: { value: string };
};

type CommonOpts = {
  overwriteFields?: string[];
};

type TFile = NoteProps;

export class RefactorFMCommand extends RefactorBaseCommand<TFile, any> {
  constructor() {
    super("RefactorFM");
  }

  matchFile(_file: TFile) {
    return {
      isMatch: true,
    };
  }

  refactorFile(file: TFile, rule: RefactorRule): TFile {
    switch (rule.operation) {
      case "add": {
        const data = rule.data as RuleData;
        const key = data.from.key;
        file.custom[key] = data.to.value;
        break;
      }
      case "title2time": {
        const fname = file.fname;
        const t2 = fname.split(".").slice(-1);
        const t3 = t2[0].split("-").slice(0, 3).join("-");
        file.custom.date = t3;
        break;
      }
      default:
        throw Error(`${rule.operation} not supported`);
    }
    return file;
  }

  readFile(fpath: string): NoteProps {
    return file2Note(fpath, { fsPath: path.dirname(fpath) });
  }

  writeFile(_fpath: string, _data: TFile) {
    // const root = path.dirname(fpath);
    throw Error("not implemented");
    // return note2File(data, root);
  }
}

export type RefactorFMCliOpts = {
  vault: DVault;
} & CommonOpts;
