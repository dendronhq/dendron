import { DLink, DVault, NotePropsMeta } from "@dendronhq/common-all";
import {
  NodeJSFileStore,
  parseAllNoteFiles,
  SqliteFactory,
  SqliteMetadataStore,
} from "@dendronhq/engine-server";
import { URI } from "vscode-uri";

describe("GIVEN sqlite store", () => {
  // afterEach(async () => {
  //   await SQLiteMetadataStore.prisma().$disconnect();
  // });
  // jest.setTimeout(10e3);

  test("WHEN playground THEN nothing is verified", async () => {
    const factory = new SqliteFactory();
    const db = await factory.init();

    await new Promise<void>((resolve) => {
      db.run("PRAGMA foreign_keys = ON", (err) => {
        if (!err) {
          resolve();
        }
      });
    });

    const fakeVault: DVault = {
      name: "fakeVault",
      fsPath: ".",
    };

    const fileStore = new NodeJSFileStore();

    const vpath = "/Users/jyeung/code/dendron/dendron/test-workspace/vault/";
    const resp = await fileStore.readDir({
      root: URI.parse(vpath),
      include: ["*.md"],
    });

    const paths = resp.data!;
    // const paths = resp.data?.map((value) => path.join(vpath, value));

    // debugger;
    await parseAllNoteFiles(paths!, fakeVault, db, vpath);

    const metadataStore = new SqliteMetadataStore(db);

    const res = await metadataStore.get("apples");

    const fakeDLink: DLink = {
      type: "wiki",
      value: "[[something.fake]]",
      from: {
        fname: "testNote",
        id: "testNote",
        vaultName: "fakeVault",
        uri: undefined,
        anchorHeader: undefined,
      },
      to: {
        fname: "dendron.apples",
        id: "apples",
      },
    };

    const testProps: NotePropsMeta = {
      id: "testNote",
      title: "",
      desc: "",
      updated: 0,
      created: 0,
      fname: "testNote",
      links: [fakeDLink],
      anchors: {},
      type: "note",
      parent: "b8064760-d3e6-4aac-ad62-eb44a52b01be", // This is root in test-workspace
      children: ["testNote.child1", "testNote.child2"],
      data: undefined,
      vault: fakeVault,
    };

    const writeRes = await metadataStore.write("testNote", testProps);
    const deleteRes = await metadataStore.delete("testNote");

    const findRespOne = await metadataStore.find({ fname: "dendron.apples" });
    // debugger;
    const findRespTwo = await metadataStore.find({
      fname: "dendron.apples",
      excludeStub: true,
    });
    // debugger;
    const findRespThree = await metadataStore.find({
      fname: "dendron.apples",
      vault: fakeVault,
    });

    debugger;
  });
});
