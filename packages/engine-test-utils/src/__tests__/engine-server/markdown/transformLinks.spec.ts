import { DEngineClient, DNoteLoc, DVault } from "@dendronhq/common-all";
import {
  DendronASTDest,
  MDUtilsV4,
  TransformLinkOpts,
  transformLinks,
} from "@dendronhq/engine-server";
import { testWithEngine } from "../../../engine";
import { checkVFile } from "./utils";

function cproc(
  opts: { engine: DEngineClient; vault: DVault } & TransformLinkOpts
) {
  const { engine, vault, from, to } = opts;
  const proc = MDUtilsV4.procFull({
    dest: DendronASTDest.MD_DENDRON,
    engine,
    vault,
    fname: "foo",
  }).use(transformLinks, { from, to });
  return proc;
}

describe("replaceLinks", () => {
  describe("single", () => {
    testWithEngine("basic", async ({ engine, vaults }) => {
      const vault = vaults[0];
      const content = ["[[bond]]"].join("\n");
      const from: DNoteLoc = {
        fname: "bond",
      };
      const to: DNoteLoc = {
        fname: "bar",
      };
      const resp = await cproc({ engine, vault, from, to }).process(content);
      await checkVFile(resp, "[[bar]]");
    });

    testWithEngine("ref", async ({ vaults, engine }) => {
      const vault = vaults[0];
      const content = ["![[bond]]"].join("\n");
      const from: DNoteLoc = {
        fname: "bond",
        vault,
      };
      const to: DNoteLoc = {
        fname: "bar",
        vault,
      };
      const resp = await cproc({ engine, vault, from, to }).process(content);
      await checkVFile(resp, "![[bar]]");
    });

    testWithEngine("multiple", async ({ engine, vaults }) => {
      const vault = vaults[0];
      const content = ["[[bond]] [[bond]]"].join("\n");
      const from: DNoteLoc = {
        fname: "bond",
        vault,
      };
      const to: DNoteLoc = {
        fname: "bar",
        vault,
      };
      const resp = await cproc({ engine, vault, from, to }).process(content);
      await checkVFile(resp, "[[bar]] [[bar]]");
    });

    testWithEngine("inline code", async ({ vaults, engine }) => {
      const vault = vaults[0];
      const content = ["`[[bond]]`"].join("\n");
      const from: DNoteLoc = {
        fname: "bond",
        vault,
      };
      const to: DNoteLoc = {
        fname: "bar",
        vault,
      };
      const resp = await cproc({ engine, vault, from, to }).process(content);
      await checkVFile(resp, "`[[bond]]`");
    });

    testWithEngine("fenced code", async ({ vaults, engine }) => {
      const vault = vaults[0];
      const content = ["```", "[[bond]]", "```"].join("\n");
      const from: DNoteLoc = {
        fname: "bond",
        vault,
      };
      const to: DNoteLoc = {
        fname: "bar",
        vault,
      };
      const resp = await cproc({ engine, vault, from, to }).process(content);
      await checkVFile(resp, "```\n[[bond]]\n```");
    });

    testWithEngine("with alias", async ({ vaults, engine }) => {
      const content = ["[[hero|bond]]"].join("\n");
      const vault = vaults[0];
      const from: DNoteLoc = {
        fname: "bond",
        vault,
      };
      const to: DNoteLoc = {
        fname: "bar",
        vault,
      };
      const resp = await cproc({ engine, vault, from, to }).process(content);
      await checkVFile(resp, "[[hero|bar]]");
    });

    testWithEngine("with offset ", async ({ vaults, engine }) => {
      const vault = vaults[0];
      const content = ["   [[bond]]"].join("\n");
      const from: DNoteLoc = {
        fname: "bond",
        vault,
      };
      const to: DNoteLoc = {
        fname: "bar",
        vault,
      };
      const resp = await cproc({ engine, vault, from, to }).process(content);
      await checkVFile(resp, "[[bar]]");
    });

    testWithEngine("with vault prefix", async ({ vaults, engine }) => {
      const vault = vaults[0];
      const content = "[[dendron://vault1/bond]]";
      const from: DNoteLoc = {
        fname: "bond",
        vault,
      };
      const to: DNoteLoc = {
        fname: "bar",
        vault,
      };
      const resp = await cproc({ engine, vault, from, to }).process(content);
      await checkVFile(resp, "[[dendron://vault1/bar]]");
    });
  });
});
