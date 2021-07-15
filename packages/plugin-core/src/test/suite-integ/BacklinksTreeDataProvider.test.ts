import { NoteProps, NoteUtils, VaultUtils } from "@dendronhq/common-all";
import {
  NoteTestUtilsV4,
  NOTE_PRESETS_V4,
  toPlainObject,
} from "@dendronhq/common-test-utils";
import path from "path";
import * as vscode from "vscode";
import { Uri } from "vscode";
import { ReloadIndexCommand } from "../../commands/ReloadIndex";
import BacklinksTreeDataProvider from "../../features/BacklinksTreeDataProvider";
import { VSCodeUtils } from "../../utils";
import { DendronWorkspace } from "../../workspace";
import { expect, runMultiVaultTest } from "../testUtilsv2";
import { runLegacyMultiWorkspaceTest, setupBeforeAfter } from "../testUtilsV3";
import { TestConfigUtils } from "@dendronhq/engine-test-utils";

const getChildren = async () => {
  const backlinksTreeDataProvider = new BacklinksTreeDataProvider();
  const parents = await backlinksTreeDataProvider.getChildren();
  const parentsWithChildren = [];

  for (const parent of parents) {
    parentsWithChildren.push({
      ...parent,
      children: await backlinksTreeDataProvider.getChildren(parent),
    });
  }

  return {
    out: parentsWithChildren,
    provider: backlinksTreeDataProvider,
  };
};

suite("BacklinksTreeDataProvider", function () {
  let ctx: vscode.ExtensionContext;

  ctx = setupBeforeAfter(this, {
    beforeHook: () => {
      VSCodeUtils.closeAllEditors();
    },
    afterHook: () => {
      VSCodeUtils.closeAllEditors();
    },
  });

  test("basics", (done) => {
    let noteWithTarget: NoteProps;

    runLegacyMultiWorkspaceTest({
      ctx,
      preSetupHook: async ({ wsRoot, vaults }) => {
        noteWithTarget = await NOTE_PRESETS_V4.NOTE_WITH_TARGET.create({
          wsRoot,
          vault: vaults[0],
        });
        await NOTE_PRESETS_V4.NOTE_WITH_LINK.create({
          wsRoot,
          vault: vaults[0],
        });
      },
      onInit: async ({ wsRoot, vaults }) => {
        await VSCodeUtils.openNote(noteWithTarget);
        const { out } = toPlainObject(await getChildren()) as any;
        expect(out[0].command.arguments[0].path as string).toEqual(
          path.join(wsRoot, vaults[0].fsPath, "beta.md")
        );
        expect(out.length).toEqual(1);
        done();
      },
    });
  });

  test("from cache", (done) => {
    let noteWithTarget: NoteProps;

    runLegacyMultiWorkspaceTest({
      ctx,
      preSetupHook: async ({ wsRoot, vaults }) => {
        noteWithTarget = await NOTE_PRESETS_V4.NOTE_WITH_TARGET.create({
          wsRoot,
          vault: vaults[0],
        });
        await NOTE_PRESETS_V4.NOTE_WITH_LINK.create({
          wsRoot,
          vault: vaults[0],
        });
      },
      onInit: async ({ wsRoot, vaults }) => {
        // re-initialize engine from cache
        await new ReloadIndexCommand().run();
        await VSCodeUtils.openNote(noteWithTarget);
        const { out } = toPlainObject(await getChildren()) as any;
        expect(out[0].command.arguments[0].path as string).toEqual(
          path.join(wsRoot, vaults[0].fsPath, "beta.md")
        );
        expect(out.length).toEqual(1);
        done();
      },
    });
  });

  test("with enableLinkCandidates from cache", (done) => {
    let noteWithTarget: NoteProps;

    runLegacyMultiWorkspaceTest({
      ctx,
      preSetupHook: async ({ wsRoot, vaults }) => {
        noteWithTarget = await NOTE_PRESETS_V4.NOTE_WITH_TARGET.create({
          wsRoot,
          vault: vaults[0],
        });
        await NOTE_PRESETS_V4.NOTE_WITH_LINK_CANDIDATE_TARGET.create({
          wsRoot,
          vault: vaults[0],
        });
      },
      onInit: async ({ wsRoot, vaults }) => {
        TestConfigUtils.withConfig(
          (config) => {
            config.dev = {
              enableLinkCandidates: true,
            };
            return config;
          },
          { wsRoot }
        );
        const isLinkCandidateEnabled = TestConfigUtils.getConfig({ wsRoot }).dev
          ?.enableLinkCandidates;
        expect(isLinkCandidateEnabled).toBeTruthy();

        await new ReloadIndexCommand().execute();
        await VSCodeUtils.openNote(noteWithTarget);

        const { out } = toPlainObject(await getChildren()) as any;
        expect(out[0].command.arguments[0].path as string).toEqual(
          path.join(wsRoot, vaults[0].fsPath, "gamma.md")
        );
        const ref = out[0].refs[0];
        expect(ref.isCandidate).toBeTruthy();
        expect(ref.matchText as string).toEqual("alpha");
        done();
      },
    });
  });

  test("multi", (done) => {
    runMultiVaultTest({
      ctx,
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
        });
      },
      onInit: async ({ wsRoot, vaults }) => {
        const notePath = path.join(wsRoot, vaults[0].fsPath, "alpha.md");
        await VSCodeUtils.openFileInEditor(Uri.file(notePath));
        const { out } = toPlainObject(await getChildren()) as any;
        expect(out[0].command.arguments[0].path as string).toEqual(
          path.join(wsRoot, vaults[1].fsPath, "beta.md")
        );
        expect(out.length).toEqual(1);
        done();
      },
    });
  });

  test("link candidates should only work within a vault", (done) => {
    let alpha: NoteProps;
    let gamma: NoteProps;
    runMultiVaultTest({
      ctx,
      preSetupHook: async ({ wsRoot, vaults }) => {
        alpha = await NoteTestUtilsV4.createNote({
          fname: "alpha",
          body: `gamma`,
          vault: vaults[0],
          wsRoot,
        });
        gamma = await NOTE_PRESETS_V4.NOTE_WITH_LINK_CANDIDATE_TARGET.create({
          wsRoot,
          vault: vaults[1],
        });
      },
      onInit: async ({ wsRoot }) => {
        TestConfigUtils.withConfig(
          (config) => {
            config.dev = {
              enableLinkCandidates: true,
            };
            return config;
          },
          { wsRoot }
        );

        await VSCodeUtils.openNote(alpha);
        const alphaOut = (toPlainObject(await getChildren()) as any).out;
        expect(alphaOut).toEqual([]);
        expect(alpha.links).toEqual([]);

        await VSCodeUtils.openNote(gamma);
        const gammaOut = (toPlainObject(await getChildren()) as any).out;
        expect(gammaOut).toEqual([]);
        expect(gamma.links).toEqual([]);
        done();
      },
    });
  });

  test("links and link candidates to correct subtree", (done) => {
    let alpha: NoteProps;
    runLegacyMultiWorkspaceTest({
      ctx,
      preSetupHook: async ({ wsRoot, vaults }) => {
        alpha = await NoteTestUtilsV4.createNote({
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
      onInit: async ({ wsRoot }) => {
        TestConfigUtils.withConfig(
          (config) => {
            config.dev = {
              enableLinkCandidates: true,
            };
            return config;
          },
          { wsRoot }
        );

        await new ReloadIndexCommand().execute();
        await VSCodeUtils.openNote(alpha);
        const { out, provider } = await getChildren();
        const outObj = toPlainObject(out) as any;

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
        const link = await provider.getChildren(out[0].children[0]);
        expect(link[0].label).toEqual("[[alpha]]");
        expect(link[0].refs).toEqual(undefined);

        const candidate = await provider.getChildren(out[0].children[1]);
        expect(candidate[0].label).toEqual("alpha");
        expect(candidate[0].refs).toEqual(undefined);

        done();
      },
    });
  });

  test("mult backlink items display correctly", (done) => {
    let alpha: NoteProps;

    runLegacyMultiWorkspaceTest({
      ctx,
      preSetupHook: async ({ wsRoot, vaults }) => {
        alpha = await NoteTestUtilsV4.createNote({
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
      onInit: async ({ wsRoot }) => {
        TestConfigUtils.withConfig(
          (config) => {
            config.dev = {
              enableLinkCandidates: true,
            };
            return config;
          },
          { wsRoot }
        );
        
        // need this until we move it out of the feature flag.
        await new ReloadIndexCommand().execute();

        await VSCodeUtils.openNote(alpha);
        const { out } = await getChildren();
        const outObj = toPlainObject(out) as any;

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

        done();
      },
    });
  });

  test("xvault link", (done) => {
    runMultiVaultTest({
      ctx,
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
      onInit: async ({ wsRoot, vaults }) => {
        const notePath = path.join(wsRoot, vaults[0].fsPath, "alpha.md");
        await VSCodeUtils.openFileInEditor(Uri.file(notePath));
        const { out } = toPlainObject(await getChildren()) as any;
        expect(out[0].command.arguments[0].path as string).toEqual(
          path.join(wsRoot, vaults[1].fsPath, "beta.md")
        );
        expect(out.length).toEqual(1);
        done();
      },
    });
  });

  test("with anchor", (done) => {
    let noteWithTarget: NoteProps;
    let noteWithLink: NoteProps;

    runMultiVaultTest({
      ctx,
      preSetupHook: async ({ wsRoot, vaults }) => {
        noteWithTarget = await NOTE_PRESETS_V4.NOTE_WITH_ANCHOR_TARGET.create({
          wsRoot,
          vault: vaults[0],
        });
        noteWithLink = await NOTE_PRESETS_V4.NOTE_WITH_ANCHOR_LINK.create({
          wsRoot,
          vault: vaults[0],
        });
      },
      onInit: async () => {
        await VSCodeUtils.openNote(noteWithTarget);
        const { out } = toPlainObject(await getChildren()) as any;
        expect(out[0].command.arguments[0].path as string).toEqual(
          NoteUtils.getFullPath({
            note: noteWithLink,
            wsRoot: DendronWorkspace.wsRoot(),
          })
        );
        expect(out.length).toEqual(1);
        done();
      },
    });
  });

  test("with alias", (done) => {
    let noteWithTarget: NoteProps;
    let noteWithLink: NoteProps;

    runMultiVaultTest({
      ctx,
      preSetupHook: async ({ wsRoot, vaults }) => {
        noteWithTarget = await NOTE_PRESETS_V4.NOTE_WITH_TARGET.create({
          wsRoot,
          vault: vaults[0],
        });
        noteWithLink = await NOTE_PRESETS_V4.NOTE_WITH_ALIAS_LINK.create({
          wsRoot,
          vault: vaults[0],
        });
      },
      onInit: async ({ wsRoot }) => {
        await VSCodeUtils.openNote(noteWithTarget);
        const { out } = toPlainObject(await getChildren()) as any;
        // assert.strictEqual(
        //   out[0].command.arguments[0].path as string,
        //   NoteUtils.getPathV4({ note: noteWithLink, wsRoot })
        // );
        expect(out[0].command.arguments[0].path as string).toEqual(
          NoteUtils.getFullPath({ note: noteWithLink, wsRoot })
        );
        // assert.strictEqual(out.length, 1);
        expect(out.length).toEqual(1);
        done();
      },
    });
  });
});

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
