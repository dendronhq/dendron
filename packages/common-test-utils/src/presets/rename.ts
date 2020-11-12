import { NoteChangeEntry, NoteUtilsV2 } from "@dendronhq/common-all";
import { note2File } from "@dendronhq/common-server";
import fs from "fs-extra";
import _ from "lodash";
import path from "path";
import { NodeTestUtilsV2 } from "..";
import { TestPresetEntry } from "../utils";

const DOMAIN_NO_CHILDREN = new TestPresetEntry({
  label: "domain with no children",
  before: async ({}: { vaultDir: string }) => {},
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
          { status: "update", fname: "foo" },
          { status: "delete", fname: "bar" },
          { status: "create", fname: "baz" },
        ],
      },
      { actual: _.trim(changed[0].note.body), expected: "[[baz]]" },
      { actual: _.includes(notesInVault, "bar.md"), expected: false },
      { actual: _.includes(notesInVault, "baz.md"), expected: true },
      { actual: _.includes(notesInVault, "foo.md"), expected: true },
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

export const RENAME_TEST_PRESETS = {
  DOMAIN_NO_CHILDREN,
  DOMAIN_NO_CHILDREN_V2,
  DOMAIN_NO_CHILDREN_V3,
};
