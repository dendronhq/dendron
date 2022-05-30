import {
  DVault,
  NoteChangeEntry,
  NoteProps,
  NoteUtils,
  VaultUtils,
} from "@dendronhq/common-all";
import {
  NOTE_PRESETS_V4,
  NoteTestUtilsV4,
  toPlainObject,
} from "@dendronhq/common-test-utils";
import { ENGINE_HOOKS, TestConfigUtils } from "@dendronhq/engine-test-utils";
import _ from "lodash";
import { afterEach, beforeEach, test } from "mocha";
import path from "path";
import sinon from "sinon";

import * as vscode from "vscode";
import { ProviderResult, Uri } from "vscode";
import { ReloadIndexCommand } from "../../commands/ReloadIndex";
import BacklinksTreeDataProvider from "../../features/BacklinksTreeDataProvider";
import { ExtensionProvider } from "../../ExtensionProvider";
import { Backlink } from "../../features/Backlink";
import { VSCodeUtils } from "../../vsCodeUtils";
import { expect } from "../testUtilsv2";
import { describeMultiWS, describeSingleWS } from "../testUtilsV3";
import { MockEngineEvents } from "./MockEngineEvents";
import { BacklinkSortOrder } from "@dendronhq/engine-server";

type BacklinkWithChildren = Backlink & { children?: Backlink[] | undefined };

/** Asking for root children (asking for children without an input) from backlinks tree
 *  data provider will us the backlinks. */
const getRootChildrenBacklinks = async (sortOrder?: BacklinkSortOrder) => {
  const mockEvents = new MockEngineEvents();
  const backlinksTreeDataProvider = new BacklinksTreeDataProvider(
    ExtensionProvider.getEngine(),
    mockEvents,
    ExtensionProvider.getDWorkspace().config.dev?.enableLinkCandidates
  );

  if (sortOrder) {
    backlinksTreeDataProvider.SortOrder = sortOrder;
  }

  const parents = await backlinksTreeDataProvider.getChildren();
  const parentsWithChildren = [];

  if (parents !== undefined) {
    for (const parent of parents) {
      parentsWithChildren.push({
        ...parent,
        // eslint-disable-next-line no-await-in-loop
        children: await backlinksTreeDataProvider.getChildren(parent),
      });
    }
  }

  return {
    out: parentsWithChildren,
    provider: backlinksTreeDataProvider,
  };
};

async function getRootChildrenBacklinksAsPlainObject(
  sortOrder?: BacklinkSortOrder
) {
  const value = await getRootChildrenBacklinks(sortOrder);

  const cleanedOutVal = {
    ...value,
    out: cleanOutParentPointersFromList(value.out),
  };
  return toPlainObject(cleanedOutVal) as any;
}

/** Refer to {@link cleanOutParentPointers} */
function cleanOutParentPointersFromList(
  backlinks: BacklinkWithChildren[]
): BacklinkWithChildren[] {
  return backlinks.map((backlink) => {
    return cleanOutParentPointers(backlink);
  });
}

/** Return a copy of backlink with parent pointers cleaned out.
 *
 *  Need to remove parent references to avoid circular serialization error when trying
 *  to serialize the backlinks within our tests (our existing tests serialize
 *  the backlinks for their assertion checks). */
function cleanOutParentPointers(
  backlink: BacklinkWithChildren
): BacklinkWithChildren {
  const copy = { ...backlink };

  if (copy.children) {
    copy.children = cleanOutParentPointersFromList(copy.children);
  }

  copy.parentBacklink = undefined;

  if (copy.refs) {
    copy.refs = copy.refs.map((ref) => {
      const refCopy = { ...ref };
      refCopy.parentBacklink = undefined;
      return refCopy;
    });
  }

  return copy;
}

function backlinksToPlainObject(backlinks: Backlink[]) {
  return toPlainObject(cleanOutParentPointersFromList(backlinks));
}

function assertAreEqual(actual: ProviderResult<Backlink>, expected: Backlink) {
  if (actual instanceof Backlink) {
    actual = cleanOutParentPointers(actual);
  } else {
    throw new Error(
      `Actual type was '${typeof actual}'. Must be Backlink type for this assert.`
    );
  }
  expected = cleanOutParentPointers(expected);

  const plainActual = toPlainObject(actual);
  const plainExpected = toPlainObject(expected);

  expect(plainActual).toEqual(plainExpected);
}

suite("BacklinksTreeDataProvider", function () {
  // Set test timeout to 3 seconds
  this.timeout(3000);

  describeSingleWS(
    "GIVEN a single vault workspace with two notes (target, link)",
    {
      postSetupHook: async ({ wsRoot, vaults }) => {
        await NOTE_PRESETS_V4.NOTE_WITH_TARGET.create({
          wsRoot,
          vault: vaults[0],
        });
        await NOTE_PRESETS_V4.NOTE_WITH_LINK.create({
          wsRoot,
          vault: vaults[0],
        });
      },
    },
    () => {
      test("THEN BacklinksTreeDataProvider calculates correct number of backlinks", async () => {
        const { engine, wsRoot, vaults } = ExtensionProvider.getDWorkspace();
        await ExtensionProvider.getWSUtils().openNote(engine.notes["alpha"]);
        const { out } = await getRootChildrenBacklinksAsPlainObject();
        const expectedPath = vscode.Uri.file(
          path.join(wsRoot, vaults[0].fsPath, "beta.md")
        ).path;
        expect(
          out[0].command.arguments[0].path.toLowerCase() as string
        ).toEqual(expectedPath.toLowerCase());
        expect(out.length).toEqual(1);
      });

      test("THEN validate get parent works", async () => {
        const { out: backlinks, provider } = await getRootChildrenBacklinks();
        const parentBacklink = backlinks[0];

        // Our utility method will add the children into out backlink structure.
        // The provider will give just the backlink hence we will remove the
        // children from the structure that will be used to assert equality.
        const parentBacklinkForAssert = { ...parentBacklink };

        // Validate children added by the test setup are able to getParent()
        expect(parentBacklink.children).toBeTruthy();
        parentBacklink.children?.forEach((child) => {
          const foundParent = provider.getParent(child);
          assertAreEqual(foundParent, parentBacklinkForAssert);
        });

        // Validate backlinks created out of refs can getParent()
        expect(parentBacklink.refs).toBeTruthy();
        const childbacklinksFromRefs = provider.getSecondLevelRefsToBacklinks(
          parentBacklink.refs!
        );
        expect(childbacklinksFromRefs).toBeTruthy();
        childbacklinksFromRefs?.forEach((backlink) => {
          const foundParent = provider.getParent(backlink);
          assertAreEqual(foundParent, parentBacklinkForAssert);
        });
      });

      test("THEN calculating backlinks from cache returns same number of backlinks", async () => {
        // re-initialize engine from cache
        await new ReloadIndexCommand().run();
        const { engine, wsRoot, vaults } = ExtensionProvider.getDWorkspace();
        await ExtensionProvider.getWSUtils().openNote(engine.notes["alpha"]);

        const { out } = await getRootChildrenBacklinksAsPlainObject();
        const expectedPath = vscode.Uri.file(
          path.join(wsRoot, vaults[0].fsPath, "beta.md")
        ).path;
        expect(
          out[0].command.arguments[0].path.toLowerCase() as string
        ).toEqual(expectedPath.toLowerCase());
        expect(out.length).toEqual(1);
      });
    }
  );

  describeMultiWS(
    "WHEN there is one note with the candidate word",
    {
      // NOTE: this test often times out
      timeout: 10e3,
      preSetupHook: async ({ wsRoot, vaults }) => {
        await NOTE_PRESETS_V4.NOTE_WITH_TARGET.create({
          wsRoot,
          vault: vaults[0],
        });
        await NOTE_PRESETS_V4.NOTE_WITH_LINK_CANDIDATE_TARGET.create({
          wsRoot,
          vault: vaults[0],
        });
      },
      modConfigCb: (config) => {
        config.dev = {
          enableLinkCandidates: true,
        };
        return config;
      },
    },
    () => {
      test("THEN finds the backlink candidate for that note", async () => {
        const { wsRoot, vaults, engine } = ExtensionProvider.getDWorkspace();
        const isLinkCandidateEnabled = TestConfigUtils.getConfig({ wsRoot }).dev
          ?.enableLinkCandidates;
        expect(isLinkCandidateEnabled).toBeTruthy();

        const noteWithTarget = NoteUtils.getNoteByFnameFromEngine({
          fname: "alpha",
          engine,
          vault: vaults[0],
        });
        await checkNoteBacklinks({ wsRoot, vaults, noteWithTarget });
      });
    }
  );

  describeMultiWS(
    "WHEN there are multiple notes with the candidate word",
    {
      preSetupHook: async ({ wsRoot, vaults }) => {
        // Create 2 notes with the same name
        await NOTE_PRESETS_V4.NOTE_WITH_TARGET.create({
          wsRoot,
          vault: vaults[0],
          genRandomId: true,
        });
        await NOTE_PRESETS_V4.NOTE_WITH_TARGET.create({
          wsRoot,
          vault: vaults[1],
          genRandomId: true,
        });
        await NOTE_PRESETS_V4.NOTE_WITH_LINK_CANDIDATE_TARGET.create({
          wsRoot,
          vault: vaults[0],
        });
      },
      modConfigCb: (config) => {
        config.dev = {
          enableLinkCandidates: true,
        };
        return config;
      },
    },
    () => {
      test("THEN finds the backlink candidate for all notes", async () => {
        const { wsRoot, vaults, engine } = ExtensionProvider.getDWorkspace();
        const isLinkCandidateEnabled = TestConfigUtils.getConfig({ wsRoot }).dev
          ?.enableLinkCandidates;
        expect(isLinkCandidateEnabled).toBeTruthy();

        // Check the backlinks for both notes
        await checkNoteBacklinks({
          wsRoot,
          vaults,
          noteWithTarget: NoteUtils.getNoteByFnameFromEngine({
            fname: "alpha",
            engine,
            vault: vaults[0],
          }),
        });
        await checkNoteBacklinks({
          wsRoot,
          vaults,
          noteWithTarget: NoteUtils.getNoteByFnameFromEngine({
            fname: "alpha",
            engine,
            vault: vaults[1],
          }),
        });
      });
    }
  );

  describeMultiWS(
    "GIVEN a multi vault workspace with notes referencing each other across vaults",
    {
      preSetupHook: async ({ wsRoot, vaults }) => {
        await NoteTestUtilsV4.createNote({
          fname: "alpha",
          body: `[[beta]]`,
          vault: vaults[0],
          wsRoot,
        });

        await NoteTestUtilsV4.createNote({
          fname: "beta",
          body: `[[alpha]]`,
          vault: vaults[1],
          wsRoot,
          props: {
            updated: 2,
          },
        });

        await NoteTestUtilsV4.createNote({
          fname: "omega",
          body: `[[alpha]]`,
          vault: vaults[1],
          wsRoot,
          props: {
            updated: 3,
          },
        });
      },
      modConfigCb: (config) => {
        config.dev = {
          enableLinkCandidates: true,
        };
        return config;
      },
    },
    () => {
      test("THEN backlink sort order is correct", async () => {
        const { wsRoot, vaults } = ExtensionProvider.getDWorkspace();
        function buildVault1Path(fileName: string) {
          return vscode.Uri.file(
            path.join(wsRoot, vaults[1].fsPath, fileName)
          ).path.toLowerCase();
        }

        const notePath = path.join(wsRoot, vaults[0].fsPath, "alpha.md");
        await VSCodeUtils.openFileInEditor(Uri.file(notePath));

        // Test Default sort order
        {
          const { out } = await getRootChildrenBacklinksAsPlainObject();
          expect(
            out[0].command.arguments[0].path.toLowerCase() as string
          ).toEqual(buildVault1Path("beta.md"));
          expect(out.length).toEqual(2);
        }

        // Test Last Updated sort order
        {
          const { out } = await getRootChildrenBacklinksAsPlainObject(
            BacklinkSortOrder.LastUpdated
          );
          expect(
            out[0].command.arguments[0].path.toLowerCase() as string
          ).toEqual(buildVault1Path("omega.md"));
          expect(out.length).toEqual(2);
        }

        // Test PathNames sort order
        {
          const { out } = await getRootChildrenBacklinksAsPlainObject(
            BacklinkSortOrder.PathNames
          );
          expect(
            out[0].command.arguments[0].path.toLowerCase() as string
          ).toEqual(buildVault1Path("beta.md"));
          expect(out.length).toEqual(2);
        }
      });

      test("THEN BacklinksTreeDataProvider calculates correct number of backlinks", async () => {
        const { engine, wsRoot, vaults } = ExtensionProvider.getDWorkspace();
        await ExtensionProvider.getWSUtils().openNote(engine.notes["alpha"]);
        const { out } = await getRootChildrenBacklinksAsPlainObject();
        const expectedPath = vscode.Uri.file(
          path.join(wsRoot, vaults[1].fsPath, "beta.md")
        ).path;
        expect(
          out[0].command.arguments[0].path.toLowerCase() as string
        ).toEqual(expectedPath.toLowerCase());
        expect(out.length).toEqual(2);
      });
    }
  );

  describeMultiWS(
    "GIVEN a multi vault workspace with two notes in different vaults",
    {
      preSetupHook: async ({ wsRoot, vaults }) => {
        await NoteTestUtilsV4.createNote({
          fname: "alpha",
          body: `gamma`,
          vault: vaults[0],
          wsRoot,
        });
        await NOTE_PRESETS_V4.NOTE_WITH_LINK_CANDIDATE_TARGET.create({
          wsRoot,
          vault: vaults[1],
        });
      },
      modConfigCb: (config) => {
        config.dev = {
          enableLinkCandidates: true,
        };
        return config;
      },
    },
    () => {
      test("THEN link candidates should only work within a vault", async () => {
        const engine = ExtensionProvider.getEngine();

        const alpha = engine.notes["alpha"];
        await ExtensionProvider.getWSUtils().openNote(alpha);
        const alphaOut = (await getRootChildrenBacklinksAsPlainObject()).out;
        expect(alphaOut).toEqual([]);
        expect(alpha.links).toEqual([]);

        const gamma = engine.notes["gamma"];
        await ExtensionProvider.getWSUtils().openNote(gamma);
        const gammaOut = (await getRootChildrenBacklinksAsPlainObject()).out;
        expect(gammaOut).toEqual([]);
        expect(gamma.links).toEqual([]);
      });
    }
  );

  describeSingleWS(
    "GIVEN a single vault workspace with links and link candidates",
    {
      postSetupHook: async ({ wsRoot, vaults }) => {
        await NoteTestUtilsV4.createNote({
          fname: "alpha",
          body: "this note has both links and candidates to it.",
          vault: vaults[0],
          wsRoot,
        });
        await NoteTestUtilsV4.createNote({
          fname: "beta",
          body: "[[alpha]]\nalpha",
          vault: vaults[0],
          wsRoot,
        });
      },
      modConfigCb: (config) => {
        config.dev = {
          enableLinkCandidates: true,
        };
        return config;
      },
    },
    () => {
      test("THEN links and link candidates should have correct subtree", async () => {
        const engine = ExtensionProvider.getEngine();

        await new ReloadIndexCommand().execute();
        const alpha = engine.notes["alpha"];
        await ExtensionProvider.getWSUtils().openNote(alpha);
        const { out, provider } = await getRootChildrenBacklinks();
        const outObj = backlinksToPlainObject(out) as any;

        // source should be beta.md

        const sourceTreeItem = outObj[0];
        expect(sourceTreeItem.label).toEqual("beta.md");
        // it should have two subtrees
        expect(sourceTreeItem.children.length).toEqual(2);

        // a subtree for link(s), holding one backlink, "[[alpha]]"
        const linkSubTreeItem = sourceTreeItem.children[0];
        expect(linkSubTreeItem.label).toEqual("Linked");
        expect(linkSubTreeItem.refs.length).toEqual(1);
        expect(linkSubTreeItem.refs[0].matchText).toEqual("[[alpha]]");

        // a subtree for candidate(s), holding one candidate item, "alpha"
        const candidateSubTreeItem = sourceTreeItem.children[1];
        expect(candidateSubTreeItem.label).toEqual("Candidates");
        expect(candidateSubTreeItem.refs.length).toEqual(1);
        expect(candidateSubTreeItem.refs[0].matchText).toEqual("alpha");

        // in each subtree, TreeItems that hold actual links should exist.
        // they are leaf nodes (no children).
        const link = await provider.getChildren(out[0].children![0]);
        expect(link![0].label).toEqual("[[alpha]]");
        expect(link![0].refs).toEqual(undefined);

        const candidate = await provider.getChildren(out[0].children![1]);
        expect(candidate![0].label).toEqual("alpha");
        expect(candidate![0].refs).toEqual(undefined);
      });
    }
  );

  describeSingleWS(
    "GIVEN a single vault workspace with links and feature flag was not enabled",
    {
      postSetupHook: async ({ wsRoot, vaults }) => {
        await NoteTestUtilsV4.createNote({
          fname: "alpha",
          body: "[[beta]] beta",
          vault: vaults[0],
          wsRoot,
        });
        await NoteTestUtilsV4.createNote({
          fname: "beta",
          body: "alpha",
          vault: vaults[0],
          wsRoot,
        });
      },
    },
    () => {
      test("THEN candidates subtree doesn't show up", async () => {
        const engine = ExtensionProvider.getEngine();

        await new ReloadIndexCommand().execute();
        const alpha = engine.notes["alpha"];
        await ExtensionProvider.getWSUtils().openNote(alpha);

        const { out: alphaOut } = await getRootChildrenBacklinks();
        const alphaOutObj = backlinksToPlainObject(alphaOut) as any;
        expect(_.isEmpty(alphaOutObj)).toBeTruthy();

        const beta = engine.notes["beta"];
        await ExtensionProvider.getWSUtils().openNote(beta);
        const { out: betaOut } = await getRootChildrenBacklinks();
        const betaOutObj = backlinksToPlainObject(betaOut) as any;
        expect(betaOutObj[0].children.length).toEqual(1);
        expect(betaOutObj[0].children[0].label).toEqual("Linked");
      });
    }
  );

  describeSingleWS(
    "GIVEN a single vault workspace and a note with many links",
    {
      postSetupHook: async ({ wsRoot, vaults }) => {
        await NoteTestUtilsV4.createNote({
          fname: "alpha",
          body: "this note has many links and candidates to it.",
          vault: vaults[0],
          wsRoot,
        });
        await NoteTestUtilsV4.createNote({
          fname: "beta",
          body: "[[alpha]] alpha alpha [[alpha]] [[alpha]] alpha\nalpha\n\nalpha",
          vault: vaults[0],
          wsRoot,
        });
      },
      modConfigCb: (config) => {
        config.dev = {
          enableLinkCandidates: true,
        };
        return config;
      },
    },
    () => {
      test("THEN multi backlink items are displayed correctly", async () => {
        const engine = ExtensionProvider.getEngine();

        // need this until we move it out of the feature flag.
        await new ReloadIndexCommand().execute();
        const alpha = engine.notes["alpha"];
        await ExtensionProvider.getWSUtils().openNote(alpha);

        const { out } = await getRootChildrenBacklinks();
        const outObj = backlinksToPlainObject(out) as any;

        // source should be beta.md

        const sourceTreeItem = outObj[0];
        expect(sourceTreeItem.label).toEqual("beta.md");
        // it should have two subtrees
        expect(sourceTreeItem.children.length).toEqual(2);

        // a subtree for link(s), holding three backlink
        const linkSubTreeItem = sourceTreeItem.children[0];
        expect(linkSubTreeItem.label).toEqual("Linked");
        expect(linkSubTreeItem.refs.length).toEqual(3);

        // a subtree for candidate(s), holding five candidate items
        const candidateSubTreeItem = sourceTreeItem.children[1];
        expect(candidateSubTreeItem.label).toEqual("Candidates");
        expect(candidateSubTreeItem.refs.length).toEqual(5);
      });
    }
  );

  describeMultiWS(
    "GIVEN a multi vault workspace with xvault links",
    {
      preSetupHook: async ({ wsRoot, vaults }) => {
        await NoteTestUtilsV4.createNote({
          fname: "alpha",
          body: `[[beta]]`,
          vault: vaults[0],
          wsRoot,
        });
        await NoteTestUtilsV4.createNote({
          fname: "beta",
          body: `[[dendron://${VaultUtils.getName(vaults[0])}/alpha]]`,
          vault: vaults[1],
          wsRoot,
        });
      },
      modConfigCb: (config) => {
        config.dev = {
          enableLinkCandidates: true,
        };
        return config;
      },
    },
    () => {
      test("THEN BacklinksTreeDataProvider calculates correct number of backlinks", async () => {
        const { engine, wsRoot, vaults } = ExtensionProvider.getDWorkspace();

        const alpha = engine.notes["alpha"];
        await ExtensionProvider.getWSUtils().openNote(alpha);
        const { out } = await getRootChildrenBacklinksAsPlainObject();
        const expectedPath = vscode.Uri.file(
          path.join(wsRoot, vaults[1].fsPath, "beta.md")
        ).path;
        expect(
          out[0].command.arguments[0].path.toLowerCase() as string
        ).toEqual(expectedPath.toLowerCase());
        expect(out.length).toEqual(1);
      });
    }
  );

  describeSingleWS(
    "GIVEN a single vault workspace and anchor notes",
    {
      postSetupHook: async ({ wsRoot, vaults }) => {
        await NOTE_PRESETS_V4.NOTE_WITH_ANCHOR_TARGET.create({
          wsRoot,
          vault: vaults[0],
        });
        await NOTE_PRESETS_V4.NOTE_WITH_ANCHOR_LINK.create({
          wsRoot,
          vault: vaults[0],
        });
      },
    },
    () => {
      test("THEN BacklinksTreeDataProvider calculates correct number of links", async () => {
        const { engine, wsRoot } = ExtensionProvider.getDWorkspace();
        const alpha = engine.notes["alpha"];
        await ExtensionProvider.getWSUtils().openNote(alpha);
        const { out } = await getRootChildrenBacklinksAsPlainObject();
        const expectedPath = vscode.Uri.file(
          NoteUtils.getFullPath({
            note: engine.notes["beta"],
            wsRoot,
          })
        ).path;

        expect(
          out[0].command.arguments[0].path.toLowerCase() as string
        ).toEqual(expectedPath.toLowerCase());
        expect(out.length).toEqual(1);
      });
    }
  );

  describeSingleWS(
    "GIVEN a single vault workspace and alias notes",
    {
      postSetupHook: async ({ wsRoot, vaults }) => {
        await NOTE_PRESETS_V4.NOTE_WITH_TARGET.create({
          wsRoot,
          vault: vaults[0],
        });
        await NOTE_PRESETS_V4.NOTE_WITH_ALIAS_LINK.create({
          wsRoot,
          vault: vaults[0],
        });
      },
    },
    () => {
      test("THEN BacklinksTreeDataProvider calculates correct number of links", async () => {
        const { engine, wsRoot } = ExtensionProvider.getDWorkspace();
        const alpha = engine.notes["alpha"];
        await ExtensionProvider.getWSUtils().openNote(alpha);
        const { out } = await getRootChildrenBacklinksAsPlainObject();
        // assert.strictEqual(
        //   out[0].command.arguments[0].path.toLowerCase() as string,
        //   NoteUtils.getPathV4({ note: noteWithLink, wsRoot })
        // );
        const expectedPath = vscode.Uri.file(
          NoteUtils.getFullPath({
            note: engine.notes["beta"],
            wsRoot,
          })
        ).path;
        expect(
          out[0].command.arguments[0].path.toLowerCase() as string
        ).toEqual(expectedPath.toLowerCase());
        expect(out.length).toEqual(1);
      });
    }
  );

  describeSingleWS(
    "GIVEN a single vault workspace and hashtags",
    {
      postSetupHook: async ({ wsRoot, vaults }) => {
        await NoteTestUtilsV4.createNote({
          wsRoot,
          vault: vaults[0],
          fname: "tags.my.test-0.tag",
        });
        await NoteTestUtilsV4.createNote({
          wsRoot,
          vault: vaults[0],
          fname: "test",
          body: "#my.test-0.tag",
        });
      },
    },
    () => {
      test("THEN BacklinksTreeDataProvider calculates correct number of links", async () => {
        const { engine, wsRoot } = ExtensionProvider.getDWorkspace();
        const alpha = engine.notes["tags.my.test-0.tag"];
        await ExtensionProvider.getWSUtils().openNote(alpha);
        const { out } = await getRootChildrenBacklinksAsPlainObject();
        const expectedPath = vscode.Uri.file(
          NoteUtils.getFullPath({
            note: engine.notes["test"],
            wsRoot,
          })
        ).path;
        expect(
          out[0].command.arguments[0].path.toLowerCase() as string
        ).toEqual(expectedPath.toLowerCase());
        expect(out.length).toEqual(1);
      });
    }
  );

  describeMultiWS(
    "WHEN a basic workspace exists",
    {
      preSetupHook: ENGINE_HOOKS.setupBasic,
    },
    () => {
      let updateSortOrder: sinon.SinonStub;
      let backlinksTreeDataProvider: BacklinksTreeDataProvider;
      let mockEvents: MockEngineEvents;

      beforeEach(() => {
        mockEvents = new MockEngineEvents();
        backlinksTreeDataProvider = new BacklinksTreeDataProvider(
          ExtensionProvider.getEngine(),
          mockEvents,
          ExtensionProvider.getEngine().config.dev?.enableLinkCandidates
        );

        updateSortOrder = sinon
          .stub(BacklinksTreeDataProvider.prototype, "SortOrder")
          .returns(undefined);
      });
      afterEach(() => {
        updateSortOrder.restore();
        backlinksTreeDataProvider.dispose();
      });

      test("AND a note gets created, THEN the data provider refresh event gets invoked", (done) => {
        const engine = ExtensionProvider.getEngine();
        const testNoteProps = engine.notes["foo"];
        const entry: NoteChangeEntry = {
          note: testNoteProps,
          status: "create",
        };

        backlinksTreeDataProvider.onDidChangeTreeData(() => {
          done();
        });

        mockEvents.testFireOnNoteChanged([entry]);
      });

      test("AND a note gets updated, THEN the data provider refresh event gets invoked", (done) => {
        const engine = ExtensionProvider.getEngine();
        const testNoteProps = engine.notes["foo"];
        const entry: NoteChangeEntry = {
          prevNote: testNoteProps,
          note: testNoteProps,
          status: "update",
        };

        backlinksTreeDataProvider.onDidChangeTreeData(() => {
          done();
        });

        mockEvents.testFireOnNoteChanged([entry]);
      });

      test("AND a note gets deleted, THEN the data provider refresh event gets invoked", (done) => {
        const engine = ExtensionProvider.getEngine();
        const testNoteProps = engine.notes["foo"];
        const entry: NoteChangeEntry = {
          note: testNoteProps,
          status: "delete",
        };

        backlinksTreeDataProvider.onDidChangeTreeData(() => {
          done();
        });

        mockEvents.testFireOnNoteChanged([entry]);
      });
    }
  );
});

async function checkNoteBacklinks({
  wsRoot,
  vaults,
  noteWithTarget,
}: {
  wsRoot: string;
  vaults: DVault[];
  noteWithTarget?: NoteProps;
}): Promise<boolean> {
  expect(noteWithTarget).toBeTruthy();
  await ExtensionProvider.getWSUtils().openNote(noteWithTarget!);

  const { out } = await getRootChildrenBacklinksAsPlainObject();
  const expectedPath = vscode.Uri.file(
    path.join(wsRoot, vaults[0].fsPath, "gamma.md")
  ).path;
  expect(out[0].command.arguments[0].path.toLowerCase() as string).toEqual(
    expectedPath.toLowerCase()
  );
  const ref = out[0].refs[0];
  expect(ref.isCandidate).toBeTruthy();
  expect(ref.matchText as string).toEqual("alpha");
  return true;
}

// suite('BacklinksTreeDataProvider', () => {

//   it('should provide backlinks', async () => {
//     const link = rndName();
//     const name0 = rndName();
//     const name1 = rndName();

//     await createFile(`${link}.md`);
//     await createFile(`a-${name0}.md`, `First note with backlink [[${link}]]`);
//     await createFile(`b-${name1}.md`, `Second note with backlink [[${link}]]`);

//     const doc = await openTextDocument(`${link}.md`);
//     await window.showTextDocument(doc);

//     expect(toPlainObject(await getChildren())).toMatchObject([
//       {
//         collapsibleState: 2,
//         label: `a-${name0}.md`,
//         refs: expect.any(Array),
//         description: '(1) ',
//         tooltip: `${path.join(getWorkspaceFolder()!, `a-${name0}.md`)}`,
//         command: {
//           command: 'vscode.open',
//           arguments: [
//             expect.objectContaining({
//               path: Uri.file(path.join(getWorkspaceFolder()!, `a-${name0}.md`)).path,
//               scheme: 'file',
//             }),
//             {
//               selection: [
//                 {
//                   line: 0,
//                   character: 0,
//                 },
//                 {
//                   line: 0,
//                   character: 0,
//                 },
//               ],
//             },
//           ],
//           title: 'Open File',
//         },
//         children: [
//           {
//             collapsibleState: 0,
//             label: '1:27',
//             description: `[[${link}]]`,
//             tooltip: `[[${link}]]`,
//             command: {
//               command: 'vscode.open',
//               arguments: [
//                 expect.objectContaining({
//                   path: Uri.file(path.join(getWorkspaceFolder()!, `a-${name0}.md`)).path,
//                   scheme: 'file',
//                 }),
//                 {
//                   selection: [
//                     {
//                       line: 0,
//                       character: 27,
//                     },
//                     {
//                       line: 0,
//                       character: expect.any(Number),
//                     },
//                   ],
//                 },
//               ],
//               title: 'Open File',
//             },
//           },
//         ],
//       },
//       {
//         collapsibleState: 2,
//         label: `b-${name1}.md`,
//         refs: expect.any(Array),
//         description: '(1) ',
//         tooltip: `${path.join(getWorkspaceFolder()!, `b-${name1}.md`)}`,
//         command: {
//           command: 'vscode.open',
//           arguments: [
//             expect.objectContaining({
//               path: Uri.file(path.join(getWorkspaceFolder()!, `b-${name1}.md`)).path,
//               scheme: 'file',
//             }),
//             {
//               selection: [
//                 {
//                   line: 0,
//                   character: 0,
//                 },
//                 {
//                   line: 0,
//                   character: 0,
//                 },
//               ],
//             },
//           ],
//           title: 'Open File',
//         },
//         children: [
//           {
//             collapsibleState: 0,
//             label: '1:28',
//             description: `[[${link}]]`,
//             tooltip: `[[${link}]]`,
//             command: {
//               command: 'vscode.open',
//               arguments: [
//                 expect.objectContaining({
//                   path: Uri.file(path.join(getWorkspaceFolder()!, `b-${name1}.md`)).path,
//                   scheme: 'file',
//                 }),
//                 {
//                   selection: [
//                     {
//                       line: 0,
//                       character: 28,
//                     },
//                     {
//                       line: 0,
//                       character: expect.any(Number),
//                     },
//                   ],
//                 },
//               ],
//               title: 'Open File',
//             },
//           },
//         ],
//       },
//     ]);
//   });

//   it('should provide backlinks for file with parens in name', async () => {
//     const link = `Note (${rndName()})`;
//     const name0 = rndName();
//     const name1 = rndName();

//     await createFile(`${link}.md`);
//     await createFile(`a-${name0}.md`, `First note with backlink [[${link}]]`);
//     await createFile(`b-${name1}.md`, `Second note with backlink [[${link}]]`);

//     const doc = await openTextDocument(`${link}.md`);
//     await window.showTextDocument(doc);

//     expect(toPlainObject(await getChildren())).toMatchObject([
//       {
//         collapsibleState: 2,
//         label: `a-${name0}.md`,
//         refs: expect.any(Array),
//         description: '(1) ',
//         tooltip: `${path.join(getWorkspaceFolder()!, `a-${name0}.md`)}`,
//         command: {
//           command: 'vscode.open',
//           arguments: [
//             expect.objectContaining({
//               path: Uri.file(path.join(getWorkspaceFolder()!, `a-${name0}.md`)).path,
//               scheme: 'file',
//             }),
//             {
//               selection: [
//                 {
//                   line: 0,
//                   character: 0,
//                 },
//                 {
//                   line: 0,
//                   character: 0,
//                 },
//               ],
//             },
//           ],
//           title: 'Open File',
//         },
//         children: [
//           {
//             collapsibleState: 0,
//             label: '1:27',
//             description: `[[${link}]]`,
//             tooltip: `[[${link}]]`,
//             command: {
//               command: 'vscode.open',
//               arguments: [
//                 expect.objectContaining({
//                   path: Uri.file(path.join(getWorkspaceFolder()!, `a-${name0}.md`)).path,
//                   scheme: 'file',
//                 }),
//                 {
//                   selection: [
//                     {
//                       line: 0,
//                       character: 27,
//                     },
//                     {
//                       line: 0,
//                       character: expect.any(Number),
//                     },
//                   ],
//                 },
//               ],
//               title: 'Open File',
//             },
//           },
//         ],
//       },
//       {
//         collapsibleState: 2,
//         label: `b-${name1}.md`,
//         refs: expect.any(Array),
//         description: '(1) ',
//         tooltip: `${path.join(getWorkspaceFolder()!, `b-${name1}.md`)}`,
//         command: {
//           command: 'vscode.open',
//           arguments: [
//             expect.objectContaining({
//               path: Uri.file(path.join(getWorkspaceFolder()!, `b-${name1}.md`)).path,
//               scheme: 'file',
//             }),
//             {
//               selection: [
//                 {
//                   line: 0,
//                   character: 0,
//                 },
//                 {
//                   line: 0,
//                   character: 0,
//                 },
//               ],
//             },
//           ],
//           title: 'Open File',
//         },
//         children: [
//           {
//             collapsibleState: 0,
//             label: '1:28',
//             description: `[[${link}]]`,
//             tooltip: `[[${link}]]`,
//             command: {
//               command: 'vscode.open',
//               arguments: [
//                 expect.objectContaining({
//                   path: Uri.file(path.join(getWorkspaceFolder()!, `b-${name1}.md`)).path,
//                   scheme: 'file',
//                 }),
//                 {
//                   selection: [
//                     {
//                       line: 0,
//                       character: 28,
//                     },
//                     {
//                       line: 0,
//                       character: expect.any(Number),
//                     },
//                   ],
//                 },
//               ],
//               title: 'Open File',
//             },
//           },
//         ],
//       },
//     ]);
//   });

//   it('should not provide backlinks for link within code span', async () => {
//     const link = rndName();
//     const name0 = rndName();

//     await createFile(`${link}.md`);
//     await createFile(`a-${name0}.md`, `\`[[${link}]]\``);

//     const doc = await openTextDocument(`${link}.md`);
//     await window.showTextDocument(doc);

//     expect(toPlainObject(await getChildren())).toHaveLength(0);
//   });

//   it('should not provide backlinks for link within code span 2', async () => {
//     const link = rndName();
//     const name0 = rndName();

//     await createFile(`${link}.md`);
//     await createFile(
//       `a-${name0}.md`,
//       `
//     Preceding text
//     \`[[${link}]]\`
//     Following text
//     `,
//     );

//     const doc = await openTextDocument(`${link}.md`);
//     await window.showTextDocument(doc);

//     expect(toPlainObject(await getChildren())).toHaveLength(0);
//   });

//   it('should not provide backlinks for link within fenced code block', async () => {
//     const link = rndName();
//     const name0 = rndName();

//     await createFile(`${link}.md`);
//     await createFile(
//       `a-${name0}.md`,
//       `
//     \`\`\`
//     Preceding text
//     [[${link}]]
//     Following text
//     \`\`\`
//     `,
//     );

//     const doc = await openTextDocument(`${link}.md`);
//     await window.showTextDocument(doc);

//     expect(toPlainObject(await getChildren())).toHaveLength(0);
//   });

//   it('should collapse parent items according to configuration', async () => {
//     const link = rndName();
//     const name0 = rndName();
//     const name1 = rndName();

//     await createFile(`${link}.md`);
//     await createFile(`a-${name0}.md`, `First note with backlink [[${link}]]`);
//     await createFile(`b-${name1}.md`, `Second note with backlink [[${link}]]`);

//     const doc = await openTextDocument(`${link}.md`);

//     await window.showTextDocument(doc);

//     await updateMemoConfigProperty('backlinksPanel.collapseParentItems', true);

//     expect((await getChildren()).every((child) => child.collapsibleState === 1)).toBe(true);
//   });

//   it('should expand parent items according to config', async () => {
//     const link = rndName();
//     const name0 = rndName();
//     const name1 = rndName();

//     await createFile(`${link}.md`);
//     await createFile(`a-${name0}.md`, `First note with backlink [[${link}]]`);
//     await createFile(`b-${name1}.md`, `Second note with backlink [[${link}]]`);

//     const doc = await openTextDocument(`${link}.md`);

//     await window.showTextDocument(doc);

//     expect(getMemoConfigProperty('backlinksPanel.collapseParentItems', null)).toBe(false);

//     expect((await getChildren()).every((child) => child.collapsibleState === 2)).toBe(true);
//   });
// });
