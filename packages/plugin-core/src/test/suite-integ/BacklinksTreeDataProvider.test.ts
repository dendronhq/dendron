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

  return parentsWithChildren;
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
        const out = toPlainObject(await getChildren()) as any;
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
        const out = toPlainObject(await getChildren()) as any;
        expect(out[0].command.arguments[0].path as string).toEqual(
          path.join(wsRoot, vaults[0].fsPath, "beta.md")
        );
        expect(out.length).toEqual(1);
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
        const out = toPlainObject(await getChildren()) as any;
        expect(out[0].command.arguments[0].path as string).toEqual(
          path.join(wsRoot, vaults[1].fsPath, "beta.md")
        );
        expect(out.length).toEqual(1);
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
        const out = toPlainObject(await getChildren()) as any;
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
        const out = toPlainObject(await getChildren()) as any;
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
        const out = toPlainObject(await getChildren()) as any;
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

  test("with hashtag", (done) => {
    let noteTarget: NoteProps;
    let noteWithLink: NoteProps;
    runMultiVaultTest({
      ctx,
      preSetupHook: async ({ wsRoot, vaults }) => {
        noteTarget = await NoteTestUtilsV4.createNote({
          wsRoot,
          vault: vaults[0],
          fname: "tags.my.test-0.tag",
        });
        noteWithLink = await NoteTestUtilsV4.createNote({
          wsRoot,
          vault: vaults[0],
          fname: "test",
          body: "#my.test-0.tag",
        });
      },
      onInit: async ({ wsRoot }) => {
        await VSCodeUtils.openNote(noteTarget);
        const out = toPlainObject(await getChildren()) as any;
        expect(out[0].command.arguments[0].path as string).toEqual(
          NoteUtils.getFullPath({ note: noteWithLink, wsRoot })
        );
        expect(out.length).toEqual(1);
        done();
      },
    })
  })
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
