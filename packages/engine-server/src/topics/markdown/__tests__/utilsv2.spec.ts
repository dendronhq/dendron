import { DNoteLoc, NoteUtilsV2 } from "@dendronhq/common-all";
import _ from "lodash";
import { ParserUtilsV2 } from "../utilsv2";

describe(ParserUtilsV2, () => {
  describe("findLinks", async () => {
    test("one link", () => {
      const note = NoteUtilsV2.create({
        fname: "foo",
        id: "foo",
        created: "1",
        updated: "1",
        body: "[[bar]]",
      });
      const links = ParserUtilsV2.findLinks({ note });
      expect(links).toMatchSnapshot("bond");
      expect(links[0].to?.fname).toEqual("bar");
    });
  });

  describe("replaceLinks", async () => {
    test("one", async () => {
      const content = ["[[bond]]"].join("\n");
      const from: DNoteLoc = {
        fname: "bond",
        vault: {
          fsPath: "/tmp",
        },
      };
      const to: DNoteLoc = {
        fname: "bar",
        vault: {
          fsPath: "/tmp",
        },
      };
      const out = await ParserUtilsV2.replaceLinks({ content, from, to });
      expect(out).toMatchSnapshot();
      expect(_.trim(out)).toEqual("[[bar]]");
    });

    test("multiple", async () => {
      const content = ["[[bond]]", "[[bond]]"].join("\n");
      const from: DNoteLoc = {
        fname: "bond",
        vault: {
          fsPath: "/tmp",
        },
      };
      const to: DNoteLoc = {
        fname: "bar",
        vault: {
          fsPath: "/tmp",
        },
      };
      const out = await ParserUtilsV2.replaceLinks({ content, from, to });
      expect(out).toMatchSnapshot();
    });

    test("inline code", async () => {
      const content = ["`[[bond]]`"].join("\n");
      const from: DNoteLoc = {
        fname: "bond",
        vault: {
          fsPath: "/tmp",
        },
      };
      const to: DNoteLoc = {
        fname: "bar",
        vault: {
          fsPath: "/tmp",
        },
      };
      const out = await ParserUtilsV2.replaceLinks({ content, from, to });
      expect(out).toMatchSnapshot();
      expect(_.trim(out)).toEqual("`[[bond]]`");
    });

    test("fenced code", async () => {
      const content = ["```", "[[bond]]", "```"].join("\n");
      const from: DNoteLoc = {
        fname: "bond",
        vault: {
          fsPath: "/tmp",
        },
      };
      const to: DNoteLoc = {
        fname: "bar",
        vault: {
          fsPath: "/tmp",
        },
      };
      const out = await ParserUtilsV2.replaceLinks({ content, from, to });
      expect(out).toMatchSnapshot();
    });

    test("with alias", async () => {
      const content = ["[[hero|bond]]"].join("\n");
      const from: DNoteLoc = {
        fname: "bond",
        vault: {
          fsPath: "/tmp",
        },
      };
      const to: DNoteLoc = {
        fname: "bar",
        vault: {
          fsPath: "/tmp",
        },
      };
      const out = await ParserUtilsV2.replaceLinks({ content, from, to });
      expect(out).toMatchSnapshot();
      expect(_.trim(out)).toEqual("[[hero|bar]]");
    });

    test("with offset ", async () => {
      const content = ["   [[bond]]"].join("\n");
      const from: DNoteLoc = {
        fname: "bond",
        vault: {
          fsPath: "/tmp",
        },
      };
      const to: DNoteLoc = {
        fname: "bar",
        vault: {
          fsPath: "/tmp",
        },
      };
      const out = await ParserUtilsV2.replaceLinks({ content, from, to });
      expect(out).toMatchSnapshot();
      expect(_.trim(out)).toEqual("[[bar]]");
    });
  });
});
