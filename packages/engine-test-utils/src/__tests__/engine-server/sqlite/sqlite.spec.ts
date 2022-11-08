import { DLink, DVault, NotePropsMeta } from "@dendronhq/common-all";
import {
  NodeJSFileStore,
  parseAllNoteFiles,
  SqliteFactory,
  SqliteMetadataStore,
} from "@dendronhq/engine-server";
import { URI } from "vscode-uri";

describe("GIVEN sqlite store", () => {
  jest.setTimeout(10e6);

  test("WHEN playground THEN nothing is verified", async () => {
    // const wsRoot = "/Users/jyeung/code/dendron/dendron/test-workspace/";
    // const vault1: DVault = {
    //   name: "vault",
    //   fsPath: "vault",
    // };

    const wsRoot = "/Users/jyeung/code/dendron/org-workspace/";
    const vault1: DVault = {
      name: "private",
      fsPath: "org-private",
      selfContained: true,
    };

    const db = await SqliteFactory.init(
      wsRoot,
      [vault1],
      new NodeJSFileStore(),
      "/Users/jyeung/code/dendron/dendron/dendron.test3.db"
    );

    // await new Promise<void>((resolve) => {
    //   db.run("PRAGMA foreign_keys = ON", (err) => {
    //     if (!err) {
    //       resolve();
    //     }
    //   });
    // });

    const fakeVault: DVault = {
      name: "fakeVault",
      fsPath: ".",
    };

    // const fileStore = new NodeJSFileStore();

    // const vpath = "/Users/jyeung/code/dendron/dendron/test-workspace/vault/";
    // // const vpath = "/Users/jyeung/code/dendron/org-workspace/org-private/notes";
    // const resp = await fileStore.readDir({
    //   root: URI.parse(vpath),
    //   include: ["*.md"],
    // });

    // const paths = resp.data!;

    // // TODO: Add in schemaModuleDict
    // await parseAllNoteFiles(paths!, fakeVault, db, vpath, {});

    const metadataStore = new SqliteMetadataStore(db, [vault1]);

    // const res = await metadataStore.get("apples");

    // const fakeDLink: DLink = {
    //   type: "wiki",
    //   value: "[[something.fake]]",
    //   from: {
    //     fname: "testNote",
    //     id: "testNote",
    //     vaultName: "fakeVault",
    //     uri: undefined,
    //     anchorHeader: undefined,
    //   },
    //   to: {
    //     fname: "dendron.apples",
    //     id: "apples",
    //   },
    // };

    // const testProps: NotePropsMeta = {
    //   id: "testNote",
    //   title: "",
    //   desc: "",
    //   updated: 0,
    //   created: 0,
    //   fname: "testNote",
    //   links: [fakeDLink],
    //   anchors: {},
    //   type: "note",
    //   parent: "b8064760-d3e6-4aac-ad62-eb44a52b01be", // This is root in test-workspace
    //   children: ["testNote.child1", "testNote.child2"],
    //   data: undefined,
    //   vault: fakeVault,
    // };

    // const writeRes = await metadataStore.write("testNote", testProps);
    // const deleteRes = await metadataStore.delete("testNote");

    // debugger;

    // const findRespOne = await metadataStore.find({ fname: "dendron.apples" });
    // // debugger;
    // const findRespTwo = await metadataStore.find({
    //   fname: "dendron.apples",
    //   excludeStub: true,
    // });
    // // debugger;
    // const findRespThree = await metadataStore.find({
    //   fname: "dendron.apples",
    //   vault: fakeVault,
    // });

    debugger;
  });
});
