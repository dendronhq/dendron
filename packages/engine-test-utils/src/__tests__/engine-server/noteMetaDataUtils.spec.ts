import { DLink, NoteProps, NoteUtils, RespV3 } from "@dendronhq/common-all";
import {
  NoteTestUtilsV4,
  SetupHookFunction,
} from "@dendronhq/common-test-utils";
import {
  NotemetadataExtractScalarProps,
  NoteMetadataUtils,
} from "@dendronhq/engine-server";
import { runEngineTestV5 } from "../../engine";
import { checkString } from "../../utils";

const preSetupHookForLinksAndTags: SetupHookFunction = async ({
  wsRoot,
  vaults,
}) => {
  const vault = vaults[0];
  await NoteTestUtilsV4.createNote({
    fname: "foo",
    body: "#alpha\n#beta\n[[gamma]]\n[[delta]]\n",
    vault,
    wsRoot,
  });
  return;
};

// === Tests

const simpleScalars = [
  ["string", NoteMetadataUtils.extractString],
  ["boolean", NoteMetadataUtils.extractBoolean],
  ["number", NoteMetadataUtils.extractNumber],
] as [string, (opts: NotemetadataExtractScalarProps) => RespV3<any>][];

describe("extract scalar", () => {
  const vault = { fsPath: "DUMMY" };
  const note = NoteUtils.create({
    vault,
    custom: {
      astring: null,
      abool: null,
      anumber: null,
    },
    fname: "alpha",
  });

  describe("AND WHEN scalar is null", () => {
    describe("AND WHEN strictNullCheck = false", () => {
      const strictNullChecks = false;
      test.concurrent.each(simpleScalars)(
        `THEN %s returns undefined`,
        async (_type, extract) => {
          expect(extract({ note, key: `a${_type}`, strictNullChecks })).toEqual(
            {
              data: undefined,
            }
          );
        }
      );
    });

    describe("AND WHEN strictNullCheck = true", () => {
      const strictNullChecks = true;
      test.concurrent.each(simpleScalars)(
        `THEN %s returns error`,
        async (_type, extract) => {
          const error = extract({
            note,
            key: `a${_type}`,
            strictNullChecks,
            required: true,
          }).error;
          expect(
            checkString(error?.message || "", "is wrong type")
          ).toBeTruthy();
        }
      );
    });
  });

  describe("AND WHEN scalar is filled", () => {
    const note = NoteUtils.create({
      vault,
      custom: {
        astring: "astring",
        abool: true,
        anumber: 1,
      },
      fname: "alpha",
    });

    test.concurrent.each(simpleScalars)(
      `THEN %s returns %s value`,
      async (_type, extract) => {
        expect(extract({ note, key: `a${_type}` })).toEqual({
          data: note[`a${_type}` as keyof NoteProps],
        });
      }
    );
  });
});

describe("WHEN extracting links", () => {
  const preSetupHook = preSetupHookForLinksAndTags;

  describe("AND WHEN extract single link", () => {
    let links: DLink[];
    beforeAll(async () => {
      await runEngineTestV5(
        async ({ engine }) => {
          const note = (await engine.getNote("foo")).data!;
          links = NoteMetadataUtils.extractLinks({
            note,
            filters: ["gamma"],
          });
        },
        { expect, preSetupHook }
      );
    });
    test("THEN extract one link", () => {
      expect(links.length).toEqual(1);
    });
    test("THEN link is equal to filter", () => {
      expect(links[0]).toMatchObject({
        alias: undefined,
        from: { fname: "foo", id: "foo", vaultName: "vault1" },
        position: {
          end: { column: 10, line: 3, offset: 22 },
          indent: [],
          start: { column: 1, line: 3, offset: 13 },
        },
        sameFile: false,
        to: {
          anchorHeader: undefined,
          fname: "gamma",
          vaultName: undefined,
        },
        type: "wiki",
        value: "gamma",
        xvault: false,
      });
    });
  });
});

describe("when extracting tags", () => {
  const preSetupHook = preSetupHookForLinksAndTags;
  const alphaTag = {
    alias: "#alpha",
    from: {
      fname: "foo",
      id: "foo",
      vaultName: "vault1",
    },
    position: {
      end: {
        column: 7,
        line: 1,
        offset: 6,
      },
      indent: [],
      start: {
        column: 1,
        line: 1,
        offset: 0,
      },
    },
    sameFile: undefined,
    to: {
      anchorHeader: undefined,
      fname: "tags.alpha",
      vaultName: undefined,
    },
    type: "wiki",
    value: "tags.alpha",
    xvault: false,
  };

  const setupEngineForMultiTag = async (filters: string[]) => {
    let links: DLink[] = [];
    await runEngineTestV5(
      async ({ engine }) => {
        const note = (await engine.getNote("foo")).data!;
        links = NoteMetadataUtils.extractTags({
          note,
          filters,
        });
      },
      { expect, preSetupHook }
    );
    return links;
  };

  const setupEngineForSingleTag = async (filters: string[]) => {
    let resp: RespV3<DLink | undefined>;
    await runEngineTestV5(
      async ({ engine }) => {
        const note = (await engine.getNote("foo")).data!;
        resp = NoteMetadataUtils.extractSingleTag({
          note,
          filters,
        });
      },
      { expect, preSetupHook }
    );
    // @ts-ignore
    return resp;
  };

  describe("AND WHEN extract single tag AND filter to one", () => {
    let resp: RespV3<DLink | undefined>;
    beforeAll(async () => {
      resp = await setupEngineForSingleTag(["tags.alpha"]);
    });

    test("THEN extract one tag", () => {
      expect(resp.data).toEqual(alphaTag);
    });
  });

  describe("AND WHEN extract single tag AND filter to many", () => {
    let resp: RespV3<DLink | undefined>;
    beforeAll(async () => {
      resp = await setupEngineForSingleTag(["tags.*"]);
    });

    test("THEN show error", () => {
      expect(resp.error!.message).toEqual(
        "singleTag field has multiple values. note: foo, tags: #alpha, #beta"
      );
    });
  });

  describe("AND WHEN extract multi tag AND filter to one", () => {
    let links: DLink[];
    beforeAll(async () => {
      links = await setupEngineForMultiTag(["tags.alpha"]);
    });

    test("THEN extract one tag", () => {
      expect(links.length).toEqual(1);
    });
    test("THEN link is equal to filter", () => {
      expect(links[0]).toEqual(alphaTag);
    });
  });

  describe("AND WHEN extract multi tag AND filter to all", () => {
    let links: DLink[];

    beforeAll(async () => {
      links = await setupEngineForMultiTag(["tags.*"]);
    });

    test("THEN extract one tag", () => {
      expect(links.length).toEqual(2);
    });

    test("THEN link is equal to filter", () => {
      expect(links[0]).toEqual(alphaTag);
    });
  });
});
