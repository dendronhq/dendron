import fs from "fs-extra";
import matter from "gray-matter";
import _ from "lodash";
import path from "path";
import tmp, { DirResult } from "tmp";
import { readYAML, node2MdFile } from "./files";
import { NoteRawProps, Note, DNodeRawProps } from "@dendronhq/common-all";
import { tmpDir } from "../lib";

export { DirResult };
// eslint-disable-next-line no-undef

tmp.setGracefulCleanup();

export type FileItem = {
  path: string;
};

export class FileTestUtils {
  /**
   * Compare files in root with expected
   * @param root
   * @param expected
   * @param opts
   */
  static cmpFiles = (
    root: string,
    expected: string[],
    opts?: { add?: string[]; remove?: string[]; ignore?: string[] }
  ) => {
    const cleanOpts = _.defaults(opts, { add: [], remove: [], ignore: [] });
    const dirEnts = fs
      .readdirSync(root)
      .filter((ent) => !_.includes(cleanOpts.ignore, ent));
    return [
      dirEnts.sort(),
      expected
        .concat(cleanOpts.add)
        .filter((ent) => {
          return !_.includes(cleanOpts?.remove, ent);
        })
        .sort(),
    ];
  };

  static async createFiles(root: string, files: FileItem[]) {
    return Promise.all(
      _.map(files, async (ent) => {
        const fpath = path.join(root, ent.path);
        return await fs.ensureFile(fpath);
      })
    );
  }

  static getFixturesRoot(base: string) {
    const pkgRoot = FileTestUtils.getPkgRoot(base);
    return path.join(pkgRoot, "fixtures");
  }

  static getPkgRoot(base: string, fname?: string): string {
    fname = fname || "package.json";
    let acc = 10;
    const lvls = [];
    while (acc > 0) {
      const tryPath = path.join(base, ...lvls, fname);
      if (fs.existsSync(tryPath)) {
        return path.dirname(tryPath);
      }
      acc -= 1;
      lvls.push("..");
    }
    throw Error(`no root found from ${base}`);
  }

  static setupDir(from: string, to: string) {
    fs.copySync(from, to);
  }

  static tmpDir(): DirResult {
    const dirPath = tmp.dirSync();
    return dirPath;
  }

  static readMDFile = (root: string, fname: string) => {
    return matter.read(path.join(root, fname));
  };

  static readYMLFile = (root: string, fname: string) => {
    return readYAML(path.join(root, fname));
  };

  static writeMDFile = (root: string, fname: string, fm: any, body: string) => {
    const fmAndBody = matter.stringify(body, fm);
    return fs.writeFileSync(path.join(root, fname), fmAndBody);
  };
}

export class NodeTestUtils {
  static createNotes = (
    vaultPath: string,
    notes: Partial<NoteRawProps>[],
    opts?: { withBody: boolean }
  ) => {
    const cleanOpts = _.defaults(opts, { withBody: true });
    node2MdFile(new Note({ fname: "root", id: "root", title: "root" }), {
      root: vaultPath,
    });
    notes.map((n) => {
      const body = cleanOpts.withBody ? n.fname + " body" : "";
      // @ts-ignore
      node2MdFile(new Note({ body, ...n }), {
        root: vaultPath,
      });
    });
  };

  static cleanNodeMeta = (opts: {
    payload: DNodeRawProps[];
    fields: string[];
  }) => {
    const { payload, fields } = opts;
    return _.sortBy(_.map(payload, (ent) => _.pick(ent, fields)));
  };

  static assertNodeBody = (opts: {
    expect: jest.Expect;
    payload: DNodeRawProps[];
    expected: { fname: string; body: string }[];
  }) => {
    const { expect, payload, expected } = opts;
    expect(
      _.sortBy(
        _.map(payload, (ent) => {
          const { body, fname } = _.pick(ent, ["body", "fname"]);
          return {
            fname,
            body: _.trim(body),
          };
        })
      )
    ).toEqual(expected);
  };
}

export class LernaTestUtils {
  static getRootDir() {
    return FileTestUtils.getPkgRoot(__dirname, "lerna.json");
  }
  static getFixturesDir(type?: string) {
    const pathSoFar = path.join(this.getRootDir(), "fixtures");
    return type ? path.join(pathSoFar, type) : pathSoFar;
  }
  static fixtureFilesForStore() {
    return fs.readdirSync(path.join(LernaTestUtils.getFixturesDir(), "store"));
  }
}

export type DendronVaultOpts = {
  /**
   * Destination. Default: create a tmp directory
   */
  root?: string;
  /**
   * Fixture to copy from. Default: 'store'
   */
  fixtureDir?: string;
  /**
   * Copy fixtures. Default: true
   */
  copyFixtures?: boolean;
};

type SetupVaultOpts = {
  vaultDir?: string;
  initDirCb?: (vaultPath: string) => void;
};

export class EngineTestUtils {
  static async setupVault(opts: SetupVaultOpts): Promise<string> {
    let vaultDir = opts.vaultDir ? opts.vaultDir : tmpDir().name;
    if (opts?.initDirCb) {
      await opts.initDirCb(vaultDir);
    }
    return vaultDir;
  }

  /**
   * setupStoreDir
   * - storeDstPath: the vault directory
   */
  static setupStoreDir(opts?: {
    storeDirSrc?: string;
    storeDstPath?: string;
    copyFixtures?: boolean;
    initDirCb?: (dirPath: string) => void;
  }) {
    const cleanOpts = _.defaults(opts, {
      storeDirSrc: "store",
      copyFixtures: true,
    });
    let { storeDirSrc, storeDstPath, copyFixtures } = cleanOpts;
    const fixturesSrcPath = LernaTestUtils.getFixturesDir(storeDirSrc);
    if (_.isUndefined(storeDstPath)) {
      storeDstPath = FileTestUtils.tmpDir().name;
    }
    if (copyFixtures) {
      fs.copySync(fixturesSrcPath, storeDstPath);
    }
    if (opts?.initDirCb) {
      opts.initDirCb(storeDstPath);
    }
    return storeDstPath;
  }
}
