import { NoteRawProps } from "@dendronhq/common-all";
import { mdFile2NodeProps, node2PropsMdFile } from "@dendronhq/common-server";
import path from "path";
import { RefactorBaseCommand, RefactorRule } from "./refactorBase";


type RuleData = {
  from: { key: string };
  to: { value: string };
};

type CommonOpts = {
  overwriteFields?: string[];
};

type TFile = NoteRawProps;

export class RefactorFMCommand extends RefactorBaseCommand<TFile, any> {
  constructor() {
    super("RefactorFM");
  }

  matchFile(_file: TFile) {
    return {
      isMatch: true
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
        const t3 = t2[0].split('-').slice(0, 3).join('-');
        file.custom.date = t3;
        break;
      }
      default:
        throw Error(`${rule.operation} not supported`);
    }
    return file;
  }

  readFile(fpath: string) {
    return mdFile2NodeProps(fpath);
  }

  writeFile(fpath: string, data: TFile) {
    const root = path.dirname(fpath);
    node2PropsMdFile(data, { root });
  }
}

export type RefactorFMCliOpts = {
  vault: string;
} & CommonOpts;
