import {
  DendronError,
  NoteChangeEntry,
  NoteUtilsV2,
} from "@dendronhq/common-all";
import { note2File } from "@dendronhq/common-server";
import fs from "fs-extra";
import _ from "lodash";
import path from "path";
import { NodeTestUtilsV2 } from "..";
import { NoteTestUtilsV3 } from "../noteUtils";
import { TestPresetEntry } from "../utils";

/**
 * # Setup:
 *
 * ## Before Init
 * - foo: [[bar]]
 * - bar: [[foo]]
 */
// beforeEach(async () => {
//   ({ vaultDir, engine } = await beforePreset());
//   vault = { fsPath: vaultDir };
//   let note = NoteUtilsV2.create({
//     fname: "foo",
//     id: "foo",
//     created: "1",
//     updated: "1",
//     body: "[[bar]]",
//     vault,
//   });
//   await note2File(note, vaultDir);
//   note = NoteUtilsV2.create({
//     fname: "bar",
//     id: "bar",
//     created: "1",
//     updated: "1",
//     body: "[[foo]]",
//     vault,
//   });
//   await note2File(note, vaultDir);
// });

const findCreated = (changed: NoteChangeEntry[]) => {
  const created = _.find(changed, { status: "create" });
  return created;
};

const DOMAIN_NO_CHILDREN = new TestPresetEntry({
  label: "domain with no children",
  results: async ({
    changed,
    vaultDir,
  }: {
    changed: NoteChangeEntry[];
    vaultDir: string;
  }) => {
    const notesInVault = fs.readdirSync(vaultDir);
    const updated = _.map(changed, (ent) => ({
      status: ent.status,
      fname: ent.note.fname,
    })).sort();
    const created = _.find(changed, { status: "create" });
    const scenarios = [
      {
        actual: updated,
        expected: [
          { status: "update", fname: "foo" },
          { status: "delete", fname: "bar" },
          { status: "create", fname: "baz" },
        ],
      },
      { actual: _.trim(changed[0].note.body), expected: "[[baz]]" },
      { actual: _.includes(notesInVault, "bar.md"), expected: false },
      { actual: _.includes(notesInVault, "baz.md"), expected: true },
      { actual: _.includes(notesInVault, "foo.md"), expected: true },
      { actual: created?.note.title, expected: "Baz" },
      {
        actual:
          fs
            .readFileSync(path.join(vaultDir, "foo.md"), { encoding: "utf8" })
            .indexOf("[[baz]]") >= 0,
        expected: true,
      },
    ];
    return scenarios;
  },
});

/**
 * create two notes that are written to after initialization with links to each other
 * rename one of the newly written notes
 * the other newly written note should be updated
 */
const DOMAIN_NO_CHILDREN_V2 = new TestPresetEntry({
  label: "domain with no children, write new node",
  before: async ({}: { vaultDir: string }) => {},
  after: async ({ vaultDir }: { vaultDir: string }) => {
    const vault = { fsPath: vaultDir };
    let alpha = NoteUtilsV2.create({
      fname: "alpha",
      id: "alpha",
      created: "1",
      updated: "1",
      body: "[[beta]]",
      vault,
    });
    let beta = NoteUtilsV2.create({
      fname: "beta",
      id: "beta",
      created: "1",
      updated: "1",
      body: "[[alpha]]",
      vault,
    });
    return { alpha, beta };
  },
  results: async ({
    changed,
    vaultDir,
  }: {
    changed: NoteChangeEntry[];
    vaultDir: string;
  }) => {
    const notesInVault = fs.readdirSync(vaultDir);
    const updated = _.map(changed, (ent) => ({
      status: ent.status,
      fname: ent.note.fname,
    })).sort();
    const scenarios = [
      {
        actual: updated,
        expected: [
          { status: "update", fname: "alpha" },
          { status: "delete", fname: "beta" },
          { status: "create", fname: "gamma" },
        ],
      },
      { actual: _.trim(changed[0].note.body), expected: "[[gamma]]" },
      { actual: _.includes(notesInVault, "beta.md"), expected: false },
      { actual: _.includes(notesInVault, "alpha.md"), expected: true },
      { actual: _.includes(notesInVault, "gamma.md"), expected: true },
      {
        actual:
          fs
            .readFileSync(path.join(vaultDir, "alpha.md"), { encoding: "utf8" })
            .indexOf("[[baz]]") >= 0,
        expected: true,
      },
    ];
    return scenarios;
  },
});

/**
 * - pre:init
 *    - note A without body
 * - post:init
 *    - note A is updated with link to note B
 *    - note B is written
 *    - note B is re-written
 * - expect
 *    - note A should be updated
 */
const DOMAIN_NO_CHILDREN_V3 = new TestPresetEntry({
  label: "domain with no children, update exsiting node",
  before: async ({ vaultDir }: { vaultDir: string }) => {
    await NodeTestUtilsV2.createNote({
      vaultDir,
      noteProps: {
        fname: "alpha",
        id: "alpha",
        created: "1",
        updated: "1",
        body: "",
      },
    });
  },
  after: async ({
    findLinks,
    vaultDir,
  }: {
    vaultDir: string;
    findLinks: Function;
  }) => {
    const vault = { fsPath: vaultDir };
    let alpha = NoteUtilsV2.create({
      fname: "alpha",
      id: "alpha",
      created: "1",
      updated: "1",
      body: "[[beta]]",
      vault,
    });
    let beta = NoteUtilsV2.create({
      fname: "beta",
      id: "beta",
      created: "1",
      updated: "1",
      body: "[[alpha]]",
      vault,
    });
    await note2File(alpha, vaultDir);
    const links = findLinks({ note: alpha });
    alpha.links = links;
    return { alpha, beta };
  },
  results: async ({
    changed,
    vaultDir,
  }: {
    changed: NoteChangeEntry[];
    vaultDir: string;
  }) => {
    const notesInVault = fs.readdirSync(vaultDir);
    const updated = _.map(changed, (ent) => ({
      status: ent.status,
      fname: ent.note.fname,
    })).sort();
    const scenarios = [
      {
        actual: updated,
        expected: [
          { status: "update", fname: "alpha" },
          { status: "delete", fname: "beta" },
          { status: "create", fname: "gamma" },
        ],
      },
      {
        actual: _.trim(changed[0].note.body),
        expected: "[[gamma]]",
        msg: "link updated in note body",
      },
      {
        actual: _.includes(notesInVault, "beta.md"),
        expected: false,
        msg: "beta note not present",
      },
      {
        actual: _.includes(notesInVault, "alpha.md"),
        expected: true,
        msg: "alpha note present",
      },
      {
        actual: _.includes(notesInVault, "gamma.md"),
        expected: true,
        msg: "gamma note present",
      },
      {
        actual:
          fs
            .readFileSync(path.join(vaultDir, "alpha.md"), { encoding: "utf8" })
            .indexOf("[[gamma]]") >= 0,
        expected: true,
        msg: "alpha has updated link",
      },
    ];
    return scenarios;
  },
});

const DOMAIN_DIFF_TITLE = new TestPresetEntry({
  label: "domain diff title",
  preSetupHook: async ({ vaults }) => {
    await NoteTestUtilsV3.createNote({
      vault: vaults[0],
      fname: "alpha",
      props: { title: "a title" },
    });
  },
  postSetupHook: async ({ engine, vaults }) => {
    if (!engine) {
      throw new DendronError({ msg: "no engine" });
    }
    const vaultDir = vaults[0].fsPath;
    await engine?.init();
    return await engine.renameNote({
      oldLoc: { fname: "alpha", vault: { fsPath: vaultDir } },
      newLoc: { fname: "beta", vault: { fsPath: vaultDir } },
    });
  },
  results: async ({ changed }: { changed: NoteChangeEntry[] }) => {
    const created = findCreated(changed);
    return [
      { actual: created?.note.title, expected: "a title" },
      { actual: created?.note.fname, expected: "beta" },
    ];
  },
});

export const RENAME_TEST_PRESETS = {
  DOMAIN_NO_CHILDREN,
  DOMAIN_NO_CHILDREN_V2,
  DOMAIN_NO_CHILDREN_V3,
  DOMAIN_DIFF_TITLE,
};
