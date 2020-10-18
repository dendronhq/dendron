import { EngineTestUtils } from "@dendronhq/common-server";
import fs from "fs-extra";
import path from "path";
import { getProcessor } from "../../../markdown/utils";

describe("basic", () => {
  describe("parse", () => {
    test("init", () => {
      const resp = getProcessor().parse(`((ref:[[foo.md]]))`);
      expect(resp).toMatchSnapshot();
      // child1 paragraph, child2 link
      // @ts-ignore
      expect(resp.children[0].children[0].data.link).toEqual({
        type: "file",
        name: "foo",
        anchorStart: undefined,
        anchorEnd: undefined,
      });
    });

    test("without suffix", () => {
      const resp = getProcessor().parse(`((ref:[[foo]]))`);
      expect(resp).toMatchSnapshot();
      // child1 paragraph, child2 link
      // @ts-ignore
      expect(resp.children[0].children[0].data.link).toEqual({
        type: "file",
        name: "foo",
        anchorStart: undefined,
        anchorEnd: undefined,
      });
    });

    test("with start anchor", () => {
      const resp = getProcessor().parse(`((ref:[[foo]]#h1))`);
      expect(resp).toMatchSnapshot();
      // child1 paragraph, child2 link
      // @ts-ignore
      expect(resp.children[0].children[0].data.link).toEqual({
        type: "file",
        name: "foo",
        anchorStart: "h1",
        anchorEnd: undefined,
      });
    });

    test("with start and end", () => {
      const resp = getProcessor().parse(`((ref:[[foo]]#h1:#h2))`);
      expect(resp).toMatchSnapshot();
      // child1 paragraph, child2 link
      // @ts-ignore
      expect(resp.children[0].children[0].data.link).toEqual({
        type: "file",
        name: "foo",
        anchorStart: "h1",
        anchorEnd: "h2",
      });
    });

    test("doesn't parse inline code block", () => {
      const resp = getProcessor().parse("`((ref:[[foo.md]]))`");
      expect(resp).toMatchSnapshot("bond");
      // @ts-ignore
      expect(resp.children[0].children[0].type).toEqual("inlineCode");
    });
    test.skip("doesn't parse code block", () => {});
  });

  describe("stingify", () => {
    let root: string;

    test("basic", async () => {
      const txt = ["", `# Tasks`, "task1", "task2"];
      root = await EngineTestUtils.setupStoreDir({
        initDirCb: (dirPath: string) => {
          fs.writeFileSync(
            path.join(dirPath, "daily.tasks.md"),
            txt.join("\n"),
            { encoding: "utf8" }
          );
        },
      });
      const out = getProcessor({ root })
        .processSync(`((ref:[[daily.tasks]]))`)
        .toString();
      expect(out).toMatchSnapshot();
      expect(out.indexOf("task1") >= 0).toBeTruthy();
    });

    test("basic block", async () => {
      const txt = ["", `# Tasks`, "task1", "task2"];
      root = await EngineTestUtils.setupStoreDir({
        initDirCb: (dirPath: string) => {
          fs.writeFileSync(
            path.join(dirPath, "daily.tasks.md"),
            txt.join("\n"),
            { encoding: "utf8" }
          );
        },
      });
      const out = getProcessor({ root })
        .processSync(
          `# Foo Bar
((ref:[[daily.tasks]]))`
        )
        .toString();
      expect(out).toMatchSnapshot();
      expect(out.indexOf("task1") >= 0).toBeTruthy();
    });

    test("basic block with fm", async () => {
      const txt = ["---", "id: foo", "---", `# Tasks`, "task1", "task2"];
      root = await EngineTestUtils.setupStoreDir({
        initDirCb: (dirPath: string) => {
          fs.writeFileSync(
            path.join(dirPath, "daily.tasks.md"),
            txt.join("\n"),
            { encoding: "utf8" }
          );
        },
      });
      const out = getProcessor({ root })
        .processSync(
          `# Foo Bar
((ref:[[daily.tasks]]))`
        )
        .toString();
      expect(out).toMatchSnapshot();
      expect(out.indexOf("task1") >= 0).toBeTruthy();
      expect(out.indexOf("---") >= 0).toBeFalsy();
    });

    test("basic block with header and start ", async () => {
      const txt = [
        "---",
        "id: foo",
        "---",
        `# Tasks`,
        "## Header1",
        "task1",
        "## Header2",
        "task2",
      ];
      root = await EngineTestUtils.setupStoreDir({
        initDirCb: (dirPath: string) => {
          fs.writeFileSync(
            path.join(dirPath, "daily.tasks.md"),
            txt.join("\n"),
            { encoding: "utf8" }
          );
        },
      });
      const out = getProcessor({ root })
        .processSync(
          `# Foo Bar
((ref:[[daily.tasks]]#Header2))`
        )
        .toString();
      expect(out).toMatchSnapshot();
      expect(out.indexOf("task1") >= 0).toBeFalsy();
      expect(out.indexOf("task2") >= 0).toBeTruthy();
    });

    test("basic block with header and start, start invalid ", async () => {
      const txt = [
        "---",
        "id: foo",
        "---",
        `# Tasks`,
        "## Header1",
        "task1",
        "## Header2",
        "task2",
      ];
      root = await EngineTestUtils.setupStoreDir({
        initDirCb: (dirPath: string) => {
          fs.writeFileSync(
            path.join(dirPath, "daily.tasks.md"),
            txt.join("\n"),
            { encoding: "utf8" }
          );
        },
      });
      const out = getProcessor({ root })
        .processSync(
          `# Foo Bar
((ref:[[daily.tasks]]#badheader))`
        )
        .toString();
      expect(out).toMatchSnapshot();
      expect(out.indexOf("Note Ref Error") >= 0).toBeTruthy();
      expect(out.indexOf("badheader not found") >= 0).toBeTruthy();
    });

    test("basic block with header, start and end, end invalid ", async () => {
      const txt = [
        "---",
        "id: foo",
        "---",
        `# Tasks`,
        "## Header1",
        "task1",
        "## Header2",
        "task2",
        "<div class='bar'>",
        "BOND",
        "</div>",
      ];
      root = await EngineTestUtils.setupStoreDir({
        initDirCb: (dirPath: string) => {
          fs.writeFileSync(
            path.join(dirPath, "daily.tasks.md"),
            txt.join("\n"),
            { encoding: "utf8" }
          );
        },
      });
      const out = getProcessor({ root })
        .processSync(
          `# Foo Bar
((ref:[[daily.tasks]]#Header1:#badheader))`
        )
        .toString();
      expect(out).toMatchSnapshot();
      expect(out.indexOf("Note Ref Error") >= 0).toBeTruthy();
      expect(out.indexOf("badheader not found") >= 0).toBeTruthy();
    });

    test("basic block with header and start, offset ", async () => {
      const txt = [
        "---",
        "id: foo",
        "---",
        `# Tasks`,
        "## Header1",
        "task1",
        "## Header2",
        "task2",
      ];
      root = await EngineTestUtils.setupStoreDir({
        initDirCb: (dirPath: string) => {
          fs.writeFileSync(
            path.join(dirPath, "daily.tasks.md"),
            txt.join("\n"),
            { encoding: "utf8" }
          );
        },
      });
      const out = getProcessor({ root })
        .processSync(
          `# Foo Bar
((ref:[[daily.tasks]]#Header2,1))`
        )
        .toString();
      expect(out).toMatchSnapshot();
      expect(out.indexOf("Header2") >= 0).toBeFalsy();
      expect(out.indexOf("task1") >= 0).toBeFalsy();
      expect(out.indexOf("task2") >= 0).toBeTruthy();
    });

    test("basic block with header, start and end ", async () => {
      const txt = [
        "---",
        "id: foo",
        "---",
        `# Tasks`,
        "## Header1",
        "task1",
        "## Header2",
        "task2",
        "<div class='bar'>",
        "BOND",
        "</div>",
      ];
      root = await EngineTestUtils.setupStoreDir({
        initDirCb: (dirPath: string) => {
          fs.writeFileSync(
            path.join(dirPath, "daily.tasks.md"),
            txt.join("\n"),
            { encoding: "utf8" }
          );
        },
      });
      const out = getProcessor({ root })
        .processSync(
          `# Foo Bar
((ref:[[daily.tasks]]#Header1:#Header2))`
        )
        .toString();
      expect(out).toMatchSnapshot();
      expect(out.indexOf("Header1") >= 0).toBeTruthy();
      expect(out.indexOf("task1") >= 0).toBeTruthy();
      expect(out.indexOf("task2") >= 0).toBeFalsy();
    });

    test("basic block with header, start and end, offset ", async () => {
      const txt = [
        "---",
        "id: foo",
        "---",
        `# Tasks`,
        "## Header1",
        "task1",
        "## Header2",
        "task2",
        "<div class='bar'>",
        "BOND",
        "</div>",
      ];
      root = await EngineTestUtils.setupStoreDir({
        initDirCb: (dirPath: string) => {
          fs.writeFileSync(
            path.join(dirPath, "daily.tasks.md"),
            txt.join("\n"),
            { encoding: "utf8" }
          );
        },
      });
      const out = getProcessor({ root })
        .processSync(
          `# Foo Bar
((ref:[[daily.tasks]]#Header1,1:#Header2))`
        )
        .toString();
      expect(out).toMatchSnapshot();
      expect(out.indexOf("Header1") >= 0).toBeFalsy();
      expect(out.indexOf("task1") >= 0).toBeTruthy();
      expect(out.indexOf("task2") >= 0).toBeFalsy();
    });

    test("basic block with wildcard as 1st elem ", async () => {
      const txt = [
        "---",
        "id: foo",
        "---",
        `# Tasks`,
        "## Header1",
        "task1",
        "## Header2",
        "task2",
        "<div class='bar'>",
        "BOND",
        "</div>",
      ];
      root = await EngineTestUtils.setupStoreDir({
        initDirCb: (dirPath: string) => {
          fs.writeFileSync(
            path.join(dirPath, "daily.tasks.md"),
            txt.join("\n"),
            { encoding: "utf8" }
          );
        },
      });
      const out = getProcessor({ root })
        .processSync(
          `# Foo Bar
((ref:[[daily.tasks]]#*,1:#header2))`
        )
        .toString();
      expect(out).toMatchSnapshot();
      expect(out.indexOf("Header1") >= 0).toBeTruthy();
      expect(out.indexOf("task1") >= 0).toBeTruthy();
      expect(out.indexOf("task2") >= 0).toBeFalsy();
    });

    test("basic block with wildcard as 2nd elem ", async () => {
      const txt = [
        "---",
        "id: foo",
        "---",
        `# Tasks`,
        "## Header1",
        "task1",
        "## Header2",
        "task2",
        "<div class='bar'>",
        "BOND",
        "</div>",
      ];
      root = await EngineTestUtils.setupStoreDir({
        initDirCb: (dirPath: string) => {
          fs.writeFileSync(
            path.join(dirPath, "daily.tasks.md"),
            txt.join("\n"),
            { encoding: "utf8" }
          );
        },
      });
      const out = getProcessor({ root })
        .processSync(
          `# Foo Bar
((ref:[[daily.tasks]]#Header1,1:#*))`
        )
        .toString();
      expect(out).toMatchSnapshot();
      expect(out.indexOf("Header1") >= 0).toBeFalsy();
      expect(out.indexOf("task1") >= 0).toBeTruthy();
      expect(out.indexOf("task2") >= 0).toBeFalsy();
    });

    test("renderWithOutline", async () => {
      const txt = [
        "---",
        "id: foo",
        "---",
        `# Tasks`,
        "## Header1",
        "task1",
        "## Header2",
        "task2",
        "<div class='bar'>",
        "BOND",
        "</div>",
      ];
      root = await EngineTestUtils.setupStoreDir({
        initDirCb: (dirPath: string) => {
          fs.writeFileSync(
            path.join(dirPath, "daily.tasks.md"),
            txt.join("\n"),
            { encoding: "utf8" }
          );
        },
      });
      const out = getProcessor({
        root,
        renderWithOutline: true,
        replaceRefs: { forNoteRefInSite: true },
      })
        .processSync(
          `# Foo Bar
((ref:[[daily.tasks]]#Header1:#Header2))`
        )
        .toString();
      expect(out).toMatchSnapshot();
      expect(out.indexOf("Header1") >= 0).toBeTruthy();
      expect(out.indexOf("task1") >= 0).toBeTruthy();
      expect(out.indexOf("task2") >= 0).toBeFalsy();
    });
  });
});
