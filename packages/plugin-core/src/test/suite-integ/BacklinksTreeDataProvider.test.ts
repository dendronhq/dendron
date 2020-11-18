import { NoteTestUtilsV3, toPlainObject } from "@dendronhq/common-test-utils";
import assert from "assert";
import { afterEach, beforeEach } from "mocha";
import path from "path";
import * as vscode from "vscode";
import { Uri } from "vscode";
import BacklinksTreeDataProvider from "../../features/BacklinksTreeDataProvider";
import { HistoryService } from "../../services/HistoryService";
import { VSCodeUtils } from "../../utils";
import { DendronWorkspace } from "../../workspace";
import { TIMEOUT } from "../testUtils";
import { runMultiVaultTest } from "../testUtilsv2";

// import BacklinksTreeDataProvider from './BacklinksTreeDataProvider';
// import {
//   createFile,
//   rndName,
//   openTextDocument,
//   closeEditorsAndCleanWorkspace,
//   getWorkspaceFolder,
//   toPlainObject,
//   updateMemoConfigProperty,
//   getMemoConfigProperty,
// } from '../test/testUtils';

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
  this.timeout(TIMEOUT);

  beforeEach(function () {
    ctx = VSCodeUtils.getOrCreateMockContext();
    DendronWorkspace.getOrCreate(ctx);
    VSCodeUtils.closeAllEditors();
  });

  afterEach(function () {
    HistoryService.instance().clearSubscriptions();
    VSCodeUtils.closeAllEditors();
  });

  test("basics", function (done) {
    runMultiVaultTest({
      ctx,
      preSetupHook: async ({ vaults }) => {
        await NoteTestUtilsV3.createNote({
          fname: "alpha",
          body: `[[beta]]`,
          vault: vaults[0],
        });
        await NoteTestUtilsV3.createNote({
          fname: "beta",
          body: `[[alpha]]`,
          vault: vaults[0],
        });
      },
      onInit: async ({ vaults }) => {
        const notePath = path.join(vaults[0].fsPath, "alpha.md");
        await VSCodeUtils.openFileInEditor(Uri.file(notePath));
        const out = toPlainObject(await getChildren()) as any;
        assert.strictEqual(
          out[0].command.arguments[0].path as string,
          path.join(vaults[0].fsPath, "beta.md")
        );
        assert.strictEqual(out.length, 1);
        done();
      },
    });
  });

  test("multi", function (done) {
    runMultiVaultTest({
      ctx,
      preSetupHook: async ({ vaults }) => {
        await NoteTestUtilsV3.createNote({
          fname: "alpha",
          body: `[[beta]]`,
          vault: vaults[0],
        });
        await NoteTestUtilsV3.createNote({
          fname: "beta",
          body: `[[alpha]]`,
          vault: vaults[1],
        });
      },
      onInit: async ({ vaults }) => {
        const notePath = path.join(vaults[0].fsPath, "alpha.md");
        await VSCodeUtils.openFileInEditor(Uri.file(notePath));
        const out = toPlainObject(await getChildren()) as any;
        assert.strictEqual(
          out[0].command.arguments[0].path as string,
          path.join(vaults[1].fsPath, "beta.md")
        );
        assert.strictEqual(out.length, 1);
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
